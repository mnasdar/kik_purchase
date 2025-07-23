const Ziggy = {
    "url": "https:\/\/purchasing.test\/login",
    "port": null,
    "defaults": {},
    "routes": {
        "sanctum.csrf-cookie": {
            "uri": "sanctum\/csrf-cookie",
            "methods": ["GET", "HEAD"]
        },
        "ignition.healthCheck": {
            "uri": "_ignition\/health-check",
            "methods": ["GET", "HEAD"]
        },
        "ignition.executeSolution": {
            "uri": "_ignition\/execute-solution",
            "methods": ["POST"]
        },
        "ignition.updateConfig": {
            "uri": "_ignition\/update-config",
            "methods": ["POST"]
        },
        "register": {
            "uri": "register",
            "methods": ["GET", "HEAD"]
        },
        "login": {
            "uri": "login",
            "methods": ["GET", "HEAD"]
        },
        "password.request": {
            "uri": "forgot-password",
            "methods": ["GET", "HEAD"]
        },
        "password.email": {
            "uri": "forgot-password",
            "methods": ["POST"]
        },
        "password.reset": {
            "uri": "reset-password\/{token}",
            "methods": ["GET", "HEAD"],
            "parameters": ["token"]
        },
        "password.update": {
            "uri": "reset-password",
            "methods": ["POST"]
        },
        "verification.notice": {
            "uri": "verify-email",
            "methods": ["GET", "HEAD"]
        },
        "verification.verify": {
            "uri": "verify-email\/{id}\/{hash}",
            "methods": ["GET", "HEAD"],
            "parameters": ["id", "hash"]
        },
        "verification.send": {
            "uri": "email\/verification-notification",
            "methods": ["POST"]
        },
        "password.confirm": {
            "uri": "confirm-password",
            "methods": ["GET", "HEAD"]
        },
        "logout": {
            "uri": "logout",
            "methods": ["POST"]
        },
        "root": {
            "uri": "\/",
            "methods": ["GET", "HEAD"]
        },
        "home": {
            "uri": "home",
            "methods": ["GET", "HEAD"]
        },
        "purchase-request.index": {
            "uri": "barang\/purchase-request",
            "methods": ["GET", "HEAD"]
        },
        "purchase-request.create": {
            "uri": "barang\/purchase-request\/create",
            "methods": ["GET", "HEAD"]
        },
        "purchase-request.store": {
            "uri": "barang\/purchase-request",
            "methods": ["POST"]
        },
        "purchase-request.show": {
            "uri": "barang\/purchase-request\/{purchase_request}",
            "methods": ["GET", "HEAD"],
            "parameters": ["purchase_request"]
        },
        "purchase-request.edit": {
            "uri": "barang\/purchase-request\/{purchase_request}\/edit",
            "methods": ["GET", "HEAD"],
            "parameters": ["purchase_request"]
        },
        "purchase-request.update": {
            "uri": "barang\/purchase-request\/{purchase_request}",
            "methods": ["PUT", "PATCH"],
            "parameters": ["purchase_request"]
        },
        "purchase-request.destroy": {
            "uri": "barang\/purchase-request\/{purchase_request}",
            "methods": ["DELETE"],
            "parameters": ["purchase_request"]
        },
        "third": {
            "uri": "{first}\/{second}\/{third}",
            "methods": ["GET", "HEAD"],
            "parameters": ["first", "second", "third"]
        },
        "second": {
            "uri": "{first}\/{second}",
            "methods": ["GET", "HEAD"],
            "parameters": ["first", "second"]
        },
        "any": {
            "uri": "{any}",
            "methods": ["GET", "HEAD"],
            "parameters": ["any"]
        }
    }
};
if (typeof window !== 'undefined' && typeof window.Ziggy !== 'undefined') {
    Object.assign(Ziggy.routes, window.Ziggy.routes);
}
export {
    Ziggy
};
