import api from './api';

const telecharger = async (url, nomFichier) => {
  const response = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data]);
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = nomFichier;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(link.href);
};

export const exportContribuables = () => telecharger('/export/contribuables.xlsx', 'contribuables.xlsx');
export const exportDeclarations = () => telecharger('/export/declarations.xlsx', 'declarations.xlsx');
export const exportPaiements = () => telecharger('/export/paiements.xlsx', 'paiements.xlsx');
export const exportStatistiquesPdf = () => telecharger('/export/statistiques.pdf', 'statistiques.pdf');
export const exportQuittancePdf = (idPaiement) => telecharger('/export/quittance/' + idPaiement + '.pdf', 'quittance-' + idPaiement + '.pdf');
export const exportAcomptes = () => telecharger('/export/acomptes.xlsx', 'acomptes.xlsx');
export const exportPenalites = () => telecharger('/export/penalites.xlsx', 'penalites.xlsx');
export const exportImpayees = (annee) => telecharger('/export/impayees.xlsx' + (annee ? '?annee=' + annee : ''), 'impayees.xlsx');
export const exportBilanPdf = (annee) => telecharger('/export/bilan.pdf' + (annee ? '?annee=' + annee : ''), 'bilan.pdf');
export const exportFichePdf = (idDeclaration) => telecharger('/export/fiche-declaration/' + idDeclaration + '.pdf', 'fiche-declaration-' + idDeclaration + '.pdf');
