package mg.safidy.service;

import mg.safidy.exception.BusinessException;
import mg.safidy.model.ParametreFiscal;
import mg.safidy.repository.ParametreFiscalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ParametreFiscalService {

    private final ParametreFiscalRepository parametreRepository;

    public ParametreFiscalService(ParametreFiscalRepository parametreRepository) {
        this.parametreRepository = parametreRepository;
    }

    public List<ParametreFiscal> lister() {
        return parametreRepository.findAll();
    }

    public ParametreFiscal trouverParId(Long id) {
        return parametreRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Parametre introuvable : id=" + id));
    }

    @Transactional
    public ParametreFiscal modifierValeur(Long id, BigDecimal valeur) {
        if (valeur == null || valeur.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Valeur du parametre invalide");
        }
        ParametreFiscal p = trouverParId(id);
        p.setValeur(valeur);
        return parametreRepository.save(p);
    }
}
