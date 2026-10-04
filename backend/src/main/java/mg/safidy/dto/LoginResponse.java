package mg.safidy.dto;

public class LoginResponse {

    private String token;
    private String type;
    private Long idAgent;
    private String nom;
    private String prenom;
    private String email;
    private String role;

    public LoginResponse() {
    }

    public LoginResponse(String token, Long idAgent, String nom, String prenom,
                         String email, String role) {
        this.token = token;
        this.type = "Bearer";
        this.idAgent = idAgent;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getIdAgent() {
        return idAgent;
    }

    public void setIdAgent(Long idAgent) {
        this.idAgent = idAgent;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
