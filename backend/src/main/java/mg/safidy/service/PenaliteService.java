package mg.safidy.service;

import mg.safidy.exception.BusinessException;
import mg.safidy.model.DeclarationIR;
import mg.safidy.model.ParametreFiscal;
import mg.safidy.model.Penalite;
import mg.safidy.repository.DeclarationIRRepository;
import mg.safidy.repository.ParametreFiscalRepository;
import mg.safidy.repository.PenaliteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class PenaliteService {

    private final PenaliteRepository penaliteRepository;
    private final DeclarationIRRepository declarationRepository;
    private final ParametreFiscalRepository parametreRepository;

    public PenaliteService(PenaliteRepository penaliteRepository,
                            DeclarationIRRepository declarationRepository,
                            ParametreFiscalRepository parametreRepository) {
        this.penaliteRepository = penaliteRepository;
        this.declarationRepository = declarationRepository;
        this.parametreRepository = parametreRepository;
    }

    public List<Penalite> listerParDeclaration(Long idDeclaration) {
        return penaliteRepository.findByDeclarationIdDeclaration(idDeclaration);
    }

    @Transactional
    public Penalite calculerAmendeDepotTardif(Long idDeclaration, LocalDate dateDepot) {
        DeclarationIR d = declarationRepository.findById(idDeclaration)
                .orElseThrow(() -> new BusinessException("Declaration introuvable"));

        LocalDate limite = d.getDateLimite() != null
                ? d.getDateLimite()
                : LocalDate.of(d.getAnnee() + 1, 5, 15);

        if (dateDepot == null || !dateDepot.isAfter(limite)) {
            throw new BusinessException("Aucun retard de depot a penaliser");
        }

        BigDecimal montant = getParametre("AMENDE_DEPOT_TARDIF", new BigDecimal("100000"));

        Penalite p = new Penalite();
        p.setDeclaration(d);
        p.setType("AMENDE_DEPOT");
        p.setNbMois(0);
        p.setTauxPct(BigDecimal.ZERO);
        p.setMontantAr(montant.longValue());
        p.setStatut("DUE");
        p.setDateCreation(LocalDateTime.now());
        return penaliteRepository.save(p);
    }

    @Transactional
    public Penalite calculerInteretRetard(Long idDeclaration, LocalDate datePaiement) {
        DeclarationIR d = declarationRepository.findById(idDeclaration)
                .orElseThrow(() -> new BusinessException("Declaration introuvable"));

        if (d.getSoldeAPayer() == null || d.getSoldeAPayer() <= 0) {
            throw new BusinessException("Aucun solde a penaliser");
        }
        LocalDate limite = d.getDateLimite() != null
                ? d.getDateLimite()
                : LocalDate.of(d.getAnnee() + 1, 5, 15);

        if (datePaiement == null || !datePaiement.isAfter(limite)) {
            throw new BusinessException("Aucun retard de paiement a penaliser");
        }

        long mois = ChronoUnit.MONTHS.between(limite, datePaiement);
        if (mois <= 0) mois = 1;
        if (datePaiement.getDayOfMonth() != limite.getDayOfMonth()
                && ChronoUnit.MONTHS.between(limite, datePaiement) == 0) {
            mois = 1;
        }

        BigDecimal taux = getParametre("TAUX_INTERET_RETARD", new BigDecimal("1"));
        long interet = BigDecimal.valueOf(d.getSoldeAPayer())
                .multiply(taux)
                .multiply(BigDecimal.valueOf(mois))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                .longValue();

        Penalite p = new Penalite();
        p.setDeclaration(d);
        p.setType("INTERET_RETARD");
        p.setNbMois((int) mois);
        p.setTauxPct(taux);
        p.setMontantAr(interet);
        p.setStatut("DUE");
        p.setDateCreation(LocalDateTime.now());
        return penaliteRepository.save(p);
    }

    @Transactional
    public Penalite annuler(Long idPenalite) {
        Penalite p = penaliteRepository.findById(idPenalite)
                .orElseThrow(() -> new BusinessException("Penalite introuvable"));
        p.setStatut("ANNULEE");
        return penaliteRepository.save(p);
    }

    @Transactional
    public Penalite marquerPayee(Long idPenalite) {
        Penalite p = penaliteRepository.findById(idPenalite)
                .orElseThrow(() -> new BusinessException("Penalite introuvable"));
        p.setStatut("PAYEE");
        return penaliteRepository.save(p);
    }

    private BigDecimal getParametre(String code, BigDecimal defaut) {
        return parametreRepository.findByCode(code)
                .map(ParametreFiscal::getValeur)
                .orElse(defaut);
    }
}
