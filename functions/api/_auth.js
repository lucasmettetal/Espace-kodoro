function bufToBase64(buf) {
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

const getSecret = (env) => {
  if (!env?.JWT_SECRET) throw new Error('JWT_SECRET non configuré');
  return env.JWT_SECRET;
};

// hashPassword : PBKDF2-SHA256, 100 000 itérations, sel aléatoire 16 octets.
// Format stocké en base : "<sel_hex>:<hash_hex>"
// Remplace l'ancien SHA-256 sans sel (vulnérable aux rainbow tables).
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 },
    keyMaterial, 256
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

// verifyPassword : compare un mot de passe en clair avec un hash stocké.
// Compatible avec le nouveau format PBKDF2 "<sel>:<hash>".
export async function verifyPassword(password, stored) {
  // Ancien format SHA-256 sans sel (32 octets hex = 64 chars, sans ':')
  if (!stored.includes(':')) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex === stored;
  }
  // Nouveau format PBKDF2
  const [saltHex, hashHex] = stored.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(h => parseInt(h, 16)));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 },
    keyMaterial, 256
  );
  const computed = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return computed === hashHex;
}

async function getKey(usage, env) {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw', encoder.encode(getSecret(env)),
    { name: 'HMAC', hash: 'SHA-256' },
    false, [usage]
  );
}

export async function signJWT(payload, env) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + 86400000 }));
  const encoder = new TextEncoder();
  const key = await getKey('sign', env);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${body}`));
  const signature = bufToBase64(sig);
  return `${header}.${body}.${signature}`;
}

export async function requireAuth(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;

    const encoder = new TextEncoder();
    const key = await getKey('verify', env);
    const sigBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify(
      'HMAC', key, sigBytes, encoder.encode(`${header}.${body}`)
    );
    if (!valid) return null;

    const payload = JSON.parse(atob(body));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
