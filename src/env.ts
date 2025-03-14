const env = {
    "EGI_ISSUER": "$EGI_CHECKIN_ISSUER",
    "AI4EOSC_ISSUER":"$AI4EOSC_KEYCLOAK_ISSUER",
    "AI4EOSC_client_id":"$AI4EOSC_KEYCLOAK_CLIENT_ID",
    "provider_url": "/protocol/",
    "client_id": "$EGI_CHECKIN_CLIENT_ID",
    "redirect_uri" : `${location.origin}/callback.html`,
    "url_authorize": "/protocol/openid-connect/auth",
    "url_user_info": "/protocol/openid-connect/userinfo",
    "token_endpoint": "/protocol/openid-connect/token",
    "deploy_container" : "false",
    "minio_local_endpoint" :"localhost",
    "minio_local_port": "30300",
    "minio_local_ssl": false ,
    "response_default_minio": "minio.minio",
    "external_ui": "https://dashboard.oscar.grycap.net",
    "ai4eosc_servers": ["https://inference.cloud.ai4eosc.eu"],
    "imagine_servers": ["https://inference.cloud.imagine-ai.eu","https://inference-walton.cloud.imagine-ai.eu"],
    "juno":{
        "repo": "https://raw.githubusercontent.com/grycap/oscar-juno/main/",
        "service": "juno.yaml",
        "script":"script.sh",
    }
}

export default env;