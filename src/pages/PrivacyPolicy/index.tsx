import { Link } from "react-router-dom";

export function PrivacyPolicy() {
  const privacyData = [
    { category: "Name of the service", details: "OSCAR" },
    {
      category: "URLs of the service",
      details: "https://dashboard.oscar.grycap.net",
    },
    {
      category: "Description of the service",
      details:
        "OSCAR is an open-source platform to support the serverless computing model for file-processing applications. It can be automatically deployed on multi-Clouds in order to create highly-parallel event-driven file-processing serverless applications that execute on customized runtime environments provided by Docker containers than run on an elastic Kubernetes cluster.",
    },
    {
      category: "Data controller",
      details:
        "Grupo de Grid y Computación de Altas Prestaciones (GRyCAP) de la Universitat Politècnica de València (UPV): Universitat Politècnica de València Camino de Vera s/n Edificio 8B, Acc. N, Nivel 1. GRyCAP Valencia, Valencia 46022 Spain\nemail: products@grycap.upv.es",
    },
    { category: "Jurisdiction", details: "ES.Spain (Valencia)" },
    {
      category: "Personal data processed",
      details:
        "The OSCAR Dashboard processes the minimum data needed to authenticate you and operate the cluster on your behalf.\n- If you log in with OSCAR credentials we store your username, password and chosen endpoint in your browser's local storage for the duration of the session.\n- If you log in through EGI Check-in or Keycloak we receive the standard OpenID Connect user profile (full name, preferred username, email, verification status, unique identifier, entitlements and assurance level) together with the issued access token. This information is kept only in your browser to personalise the UI and authorise requests against an OSCAR cluster.",
    },
    {
      category: "Purpose of the processing of personal data",
      details:
        "Authentication, authorisation and provisioning of OSCAR resources requested by the user, including retrieving cluster configuration, managing MinIO storage buckets and displaying personalised data such as your identifiers.",
    },
    {
      category: "Third parties to whom personal data is disclosed",
      details:
        "Identity information is exchanged solely with the selected authentication provider (EGI Check-in, AI4EOSC Keycloak or GRyCAP Keycloak) and with the OSCAR endpoint you choose to access. No data is sent to marketing or analytics services.",
    },
    {
      category: "How to access, rectify and delete the personal data",
      details:
        "Contact the email: products@grycap.upv.es. To rectify the data released by your Home Organisation, contact your Home Organisation's IT helpdesk",
    },
    {
      category: "Data retention",
      details:
        "Authentication data is stored locally in your browser (local storage items such as 'authData' and the issued access token). It is cleared when you log out or manually clear your browser storage. The only cookie we set (`sidebar:state`) keeps the sidebar preference for up to 7 days. No server-side copies are kept by the dashboard.",
    },    
    {
      category: "Cookies",
      details:
        "The dashboard does not use analytics or advertising cookies. We set a single functional cookie (`sidebar:state`) to remember whether the sidebar is collapsed, and we rely on your browser's local storage to keep your authentication data while you are signed in.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 overflow-auto max-h-screen">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy for OSCAR</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b text-left">Category</th>
              <th className="py-2 px-4 border-b text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {privacyData.map((item, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="py-2 px-4 border-b font-medium">
                  {item.category}
                </td>
                <td className="py-2 px-4 border-b whitespace-pre-wrap">
                  {item.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
