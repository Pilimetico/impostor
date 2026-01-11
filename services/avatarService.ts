// Servicio de Avatares: Anime High Quality
// Fuente Principal: Waifu.im API (Más estable)
// Fuente Respaldo: Lista estática ampliada

// Proxy para optimizar tamaño y formato (WebP)
const PROXY_BASE = "https://images.weserv.nl/?url=";
const PROXY_OPTS = "&w=400&output=webp&q=90";

// LISTA DE RESPALDO AMPLIADA
// Si la API falla, usamos esto. Son suficientes para que no se repitan en un grupo normal.
const BACKUP_AVATARS = [
    "https://cdn.waifu.im/7822.jpg",
    "https://cdn.waifu.im/6225.jpg",
    "https://cdn.waifu.im/7881.jpg",
    "https://cdn.waifu.im/7144.jpg",
    "https://cdn.waifu.im/6045.jpg",
    "https://cdn.waifu.im/3455.jpg",
    "https://cdn.waifu.im/7709.jpg",
    "https://cdn.waifu.im/5978.jpg",
    "https://cdn.waifu.im/7827.jpg",
    "https://cdn.waifu.im/7016.jpg",
    "https://cdn.waifu.im/6486.jpg",
    "https://cdn.waifu.im/5797.jpg",
    "https://cdn.waifu.im/7856.jpg",
    "https://cdn.waifu.im/7542.jpg",
    "https://cdn.waifu.im/7321.jpg",
    "https://cdn.waifu.im/6541.jpg",
    "https://cdn.waifu.im/5890.jpg",
    "https://cdn.waifu.im/4521.jpg",
    "https://cdn.waifu.im/3210.jpg",
    "https://cdn.waifu.im/7890.jpg"
];

let cachedRealImages: string[] = [];

// Función para barajar array (Fisher-Yates)
const shuffleArray = (array: string[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// Genera un avatar aleatorio de la lista de respaldo
export const getFallbackAvatar = () => {
    const rawUrl = BACKUP_AVATARS[Math.floor(Math.random() * BACKUP_AVATARS.length)];
    return `${PROXY_BASE}${rawUrl.replace(/^https?:\/\//, '')}${PROXY_OPTS}`;
};

// Obtiene un avatar síncrono inicial
export const getRandomAvatar = (): string => {
    // Si ya cargó la API, devolvemos uno de ahí
    if (cachedRealImages.length > 0) {
        return cachedRealImages[Math.floor(Math.random() * cachedRealImages.length)];
    }
    // Si no, devolvemos uno del backup
    return getFallbackAvatar();
};

// Conecta a la API
export const fetchRealCharacters = async (): Promise<string[]> => {
    if (cachedRealImages.length > 0) return cachedRealImages;

    try {
        // Waifu.im API: Pedimos 30 imágenes seguras (safe) de una vez
        const response = await fetch('https://api.waifu.im/search?many=true&is_nsfw=false&included_tags=maid&included_tags=waifu&limit=30');
        
        if (!response.ok) throw new Error('API Waifu.im error');
        
        const data = await response.json();
        
        // Extraemos las URLs
        const images = data.images.map((img: any) => {
            const cleanUrl = img.url.replace(/^https?:\/\//, '');
            return `${PROXY_BASE}${cleanUrl}${PROXY_OPTS}`;
        });

        if (images.length > 0) {
            // Guardamos mezcladas para asegurar variedad
            cachedRealImages = shuffleArray(images);
            return cachedRealImages;
        }
        
        throw new Error('No images found');
    } catch (error) {
        console.warn("Fallo API Anime, usando respaldo local:", error);
        // En caso de error, llenamos el caché con el backup barajado
        // para que la app crea que "cargó" y actualice las fotos
        cachedRealImages = shuffleArray(BACKUP_AVATARS.map(url => {
             return `${PROXY_BASE}${url.replace(/^https?:\/\//, '')}${PROXY_OPTS}`;
        }));
        return cachedRealImages;
    }
};