export const environment = {

    redirectURI: 'http://localhost:4200/authorized',
    logoutRedirectUrl: "http://localhost:4200/login",
    apiUrl: 'http://localhost:8080/siger-api/api', 
    authorizationCallbackUrl: 'http://localhost:8080/oauth2/authorize',
    tokenUrl: "http://localhost:8080/oauth2/token",
    logoutUrl: "http://localhost:8080/logout",
    tokenAllowedDomains: ['http://localhost:8080'],
    tokenDisallowedRoutes: ['http://localhost:8080/oauth2/token'],
    tokenRevokeUrl: "http://localhost:8080/oauth2/revoke",
    responseMode: 'form_post',
    responseType: 'code',
    clientId: 'client-dev',
    secret: 'manga', 
    scope: 'openid',
    buildNumber: 'VERSAO_PROJETO'

} 