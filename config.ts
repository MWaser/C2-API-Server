module.exports = {
    addrGBBP: 'http://etht5zt7j-dns-reg1.eastus2.cloudapp.azure.com:8540',
    wsGBBP: 'ws://etht5zt7j-dns-reg1-0.eastus2.cloudapp.azure.com:8547',
    bothLocal: 'ws://localhost:8545',
    addrCurr: '',          // switch for ganache vs GBBP (wsGBBP is nonfunctional!)
    
    // mInfoAddr: '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B',     // on Mark Waser's ganache (feel free to save your own as well)
    // playToken: { symbol: 'PLAY', name: 'GBA Play Token', decimals: 2, address: '0xC89Ce4735882C9F0f0FE26686c53074E09B0D550' },
    mInfoAddr: '0xEb088F8033D26896db3A272186272c33166Fc947',
    tokens: ['PLAY'],
    token: {
            PLAY: { symbol: 'PLAY', name: 'GBA Play Token', decimals: 2, address: '0xf2E99e3a23741449fA942705F4D504b6a099be8b' },
            REWARD: { symbol: 'REWARD', name: 'GBA Reward Token', decimals: 6, address: '' },
            UTILETH: { symbol: 'UTILETH', name: 'ETH Utility Token', decimals: 18, address: '' }
    },

    loginServer: "http://www.gbaglobal.net/",
    redirectURL: "https://gba-gbbp.azurewebsites.net",
    clientId: "ILk0iMUPYCwbXgqhtMzEg743j0jAatR8zmEvz07g",
    clientSecret: "gUjEJ2jlrfyiBka7HvBDoKGCau1ZHrFtCMSAsbs7",

    address: process.env.address || '0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e',   // Feel free to steal, it only has value on my ganache
    privateKey: process.env.privateKey || 'b0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773',
    dbConn: process.env.dbConn ? JSON.parse(process.env.dbConn) : {
        "server": "gbaorg.database.windows.net",
        "options": { "encrypt": true, "database": "dbGBBP-dev", "trustServerCertificate": true },
        "authentication": { "type": "default", "options": { "userName": "gba-dev", "password": "vedP455$" } } 
    },
    tokenSig: process.env.tokenSig || 'The GBA is awesome!'
};