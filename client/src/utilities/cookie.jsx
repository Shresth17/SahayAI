function getCookie(name) {
    console.log(document.cookie + " cookie");
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function setCookie(name, value, options = {}) {
    let cookieString = `${name}=${value}`;
    
    if (options.expires) {
        cookieString += `; expires=${options.expires}`;
    }
    
    if (options.maxAge) {
        cookieString += `; max-age=${options.maxAge}`;
    }
    
    if (options.path) {
        cookieString += `; path=${options.path}`;
    } else {
        cookieString += `; path=/`;
    }
    
    if (options.domain) {
        cookieString += `; domain=${options.domain}`;
    }
    
    if (options.secure) {
        cookieString += `; secure`;
    }
    
    if (options.sameSite) {
        cookieString += `; samesite=${options.sameSite}`;
    }
    
    if (options.httpOnly) {
        cookieString += `; httponly`;
    }
    
    document.cookie = cookieString;
}

function deleteCookie(name, options = {}) {
    // Set the cookie with an expiration date in the past
    let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
    
    // Use the same path as the original cookie (default to '/')
    const path = options.path || '/';
    cookieString += `; path=${path}`;
    
    // If a domain was specified when setting the cookie, use it when deleting
    if (options.domain) {
        cookieString += `; domain=${options.domain}`;
    }
    
    // For production deployments, try both with and without domain
    document.cookie = cookieString;
    
    // Also try without domain specification for broader compatibility
    if (options.domain) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
    }
}

export { getCookie, setCookie, deleteCookie };