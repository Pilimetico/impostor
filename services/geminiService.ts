import { GoogleGenAI, Type } from "@google/genai";
import { GameScenario } from "../types";

// Categorías Más Específicas y Temáticas
const CATEGORIES = [
  "Cine y Hollywood (ej: Palomitas, Villano, Oscar)",
  "Crimen y Misterio (ej: Huella, Lupa, Coartada)",
  "El Espacio (ej: Agujero Negro, Astronauta, Gravedad)",
  "Festival de Música (ej: Altavoz, Barro, VIP)",
  "El Zoológico (ej: Jaula, Cuidador, Ticket)",
  "Parque de Diversiones (ej: Montaña Rusa, Vómito, Fila)",
  "El Gimnasio (ej: Sudor, Espejo, Proteína)",
  "Camping y Supervivencia (ej: Fogata, Mosquito, Brújula)",
  "Aeropuerto y Viajes (ej: Pasaporte, Jet Lag, Turbulencia)",
  "Hospital (ej: Inyección, Yeso, Sala de Espera)",
  "La Cocina Gourmet (ej: Caviar, Chef, Trufa)",
  "Tecnología Retro (ej: Casete, Disquete, Arcade)",
  "Fantasía Medieval (ej: Dragón, Espada, Poción)",
  "La Oficina (ej: Fotocopiadora, Jefe, Café)"
];

// Escenarios de respaldo más interesantes por si falla la IA
const FALLBACK_SCENARIOS: GameScenario[] = [
  { location: "Titanic", category: "Historia", hint: "Violín" },
  { location: "Resaca", category: "Fiesta", hint: "Ibuprofeno" },
  { location: "Divorcio", category: "Relaciones", hint: "Abogado" },
  { location: "Wifi", category: "Tecnología", hint: "Clave" },
  { location: "Vampiro", category: "Monstruos", hint: "Ajo" },
  { location: "Lunes", category: "Tiempo", hint: "Sueño" },
  { location: "Influencer", category: "Internet", hint: "Canje" },
  { location: "Zombie", category: "Apocalipsis", hint: "Cerebro" },
  { location: "Suegra", category: "Familia", hint: "Domingo" },
  { location: "Dieta", category: "Salud", hint: "Hambre" }
];

export const generateGameScenario = async (): Promise<GameScenario> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("API Key missing, using fallback scenario.");
    return FALLBACK_SCENARIOS[Math.floor(Math.random() * FALLBACK_SCENARIOS.length)];
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Seleccionamos un tema aleatorio
    const selectedTheme = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

    // PROMPT DE ALTA DIFICULTAD Y PENSAMIENTO LATERAL - RESTRICCIÓN DE UNA SOLA PALABRA
    const prompt = `Eres el Game Master de un juego de deducción social (estilo "El Espía" o "Impostor").
    Tema seleccionado: "${selectedTheme}".
    
    Tu tarea es generar un objeto/lugar secreto y una pista para el impostor.
    
    REGLAS PARA 'location' (La Palabra Secreta):
    1. Debe ser un sustantivo específico. NO uses categorías generales.
    2. Debe ser algo que todos los adultos conozcan.
    
    REGLAS PARA 'hint' (La Pista del Impostor):
    1. ¡IMPORTANTE! DEBE SER EXACTAMENTE UNA SOLA PALABRA. (Ej: "Hielo", "Deudas", "Ruido"). PROHIBIDO USAR FRASES O MÁS DE UNA PALABRA.
    2. NIVEL DE DIFICULTAD: EXPERTO. La pista NO debe ser obvia.
    3. PROHIBIDO describir el objeto físicamente ni decir su función directa.
    4. PROHIBIDO usar sinónimos.
    5. USA PENSAMIENTO LATERAL DE SEGUNDO NIVEL: No digas lo primero que se te ocurra. Busca una asociación cultural, un sonido, un olor, o una consecuencia remota.
    
    EJEMPLOS DE LÓGICA EXPERTA:
    - Palabra: "Café". Pista Fácil: "Taza". Pista Experta: "Insomnio".
    - Palabra: "Titanic". Pista Fácil: "Barco". Pista Experta: "Violín".
    - Palabra: "Boda". Pista Fácil: "Anillo". Pista Experta: "Deudas".
    - Palabra: "Vampiro". Pista Fácil: "Sangre". Pista Experta: "Espejo".
    - Palabra: "Cárcel". Pista Fácil: "Rejas". Pista Experta: "Jabón".

    Genera el siguiente JSON: { "location": "string", "category": "string", "hint": "string" }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 1.3, // Aumentada creatividad para pistas menos obvias
        topK: 40,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            location: { type: Type.STRING },
            category: { type: Type.STRING },
            hint: { type: Type.STRING },
          },
          required: ["location", "category", "hint"],
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No text returned from Gemini");

    return JSON.parse(jsonText) as GameScenario;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return FALLBACK_SCENARIOS[Math.floor(Math.random() * FALLBACK_SCENARIOS.length)];
  }
};