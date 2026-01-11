import { GoogleGenAI, Type } from "@google/genai";
import { GameScenario } from "../types";

// --- CONFIGURACIÓN ---
// Variable para controlar la repetición en modo offline
let availableOfflineIndices: number[] = [];

// Base de datos Masiva (600+ Escenarios)
const OFFLINE_DATASET: GameScenario[] = [
  // --- SET ORIGINAL (325 Entradas) ---
  // CINE Y ESPECTÁCULO
  { location: "Doble de Riesgo", category: "Cine", hint: "Seguro" },
  { location: "Alfombra Roja", category: "Evento", hint: "Flashes" },
  { location: "Paparazzi", category: "Profesión", hint: "Arbusto" },
  { location: "Spoiler", category: "Cine", hint: "Final" },
  { location: "Casting", category: "Actuación", hint: "Fila" },
  { location: "Pantalla Verde", category: "Efectos", hint: "Croma" },
  { location: "Director", category: "Cine", hint: "Silla" },
  { location: "Cotufas", category: "Snack", hint: "Ruido" },
  { location: "Cameo", category: "Cine", hint: "Breve" },
  { location: "Oscar", category: "Premio", hint: "Dorado" },
  { location: "Sitcom", category: "TV", hint: "Risas" },
  { location: "Maquillaje", category: "Cine", hint: "Polvo" },
  { location: "Claqueta", category: "Rodaje", hint: "Acción" },
  { location: "Guionista", category: "Cine", hint: "Huelga" },
  { location: "Extra", category: "Actor", hint: "Fondo" },
  
  // HISTORIA Y CONFLICTO
  { location: "Guerra Fría", category: "Historia", hint: "Teléfono" },
  { location: "Caballo de Troya", category: "Mito", hint: "Regalo" },
  { location: "Kamikaze", category: "Guerra", hint: "Viento" },
  { location: "Trinchera", category: "Guerra", hint: "Barro" },
  { location: "Muro de Berlín", category: "Historia", hint: "Grafiti" },
  { location: "Guillotina", category: "Revolución", hint: "Canasto" },
  { location: "Peste Negra", category: "Pandemia", hint: "Máscara" },
  { location: "Titanic", category: "Desastre", hint: "Violín" },
  { location: "Gladiador", category: "Roma", hint: "Arena" },
  { location: "Vikingo", category: "Norte", hint: "Valhalla" },
  { location: "Dictador", category: "Política", hint: "Bigote" },
  { location: "Espartano", category: "Historia", hint: "Pozo" },
  { location: "Pirámide", category: "Egipto", hint: "Alien" },
  { location: "Samurái", category: "Japón", hint: "Honor" },
  { location: "Cowboy", category: "Oeste", hint: "Duelo" },

  // TECNOLOGÍA Y REDES
  { location: "Influencer", category: "Redes", hint: "Canje" },
  { location: "Hater", category: "Internet", hint: "Anónimo" },
  { location: "Tinder", category: "App", hint: "Deslizar" },
  { location: "Deepfake", category: "IA", hint: "Cara" },
  { location: "Nube", category: "Datos", hint: "Lluvia" },
  { location: "Lag", category: "Gaming", hint: "Lento" },
  { location: "Stalker", category: "Redes", hint: "Perfil" },
  { location: "Viral", category: "Internet", hint: "Contagio" },
  { location: "Bot", category: "Software", hint: "Chat" },
  { location: "Bitcoin", category: "Cripto", hint: "Minero" },
  { location: "NFT", category: "Arte", hint: "Mono" },
  { location: "Zoom", category: "Trabajo", hint: "Mudo" },
  { location: "Wifi", category: "Red", hint: "Clave" },
  { location: "Cargador", category: "Móvil", hint: "Cable" },
  { location: "Batería", category: "Energía", hint: "Porcentaje" },
  { location: "Streaming", category: "Video", hint: "Directo" },
  { location: "Youtuber", category: "Profesión", hint: "Campana" },
  { location: "Spam", category: "Correo", hint: "Basura" },
  { location: "Meme", category: "Internet", hint: "Texto" },
  { location: "Filtro", category: "Foto", hint: "Belleza" },

  // CRIMEN Y MISTERIO
  { location: "Coartada", category: "Legal", hint: "Reloj" },
  { location: "Testigo Protegido", category: "Juicio", hint: "Pixelado" },
  { location: "Crimen Perfecto", category: "Concepto", hint: "Mito" },
  { location: "Asesino Serial", category: "Criminal", hint: "Patrón" },
  { location: "Secuestro", category: "Delito", hint: "Rescate" },
  { location: "Forense", category: "Profesión", hint: "Huella" },
  { location: "Interrogatorio", category: "Policía", hint: "Espejo" },
  { location: "Padrino", category: "Mafia", hint: "Oferta" },
  { location: "Búnker", category: "Refugio", hint: "Latas" },
  { location: "Francotirador", category: "Arma", hint: "Techo" },
  { location: "Detectives", category: "Profesión", hint: "Lupa" },
  { location: "Esposas", category: "Policía", hint: "Metal" },
  { location: "Cárcel", category: "Lugar", hint: "Jabón" },
  { location: "Fuga", category: "Acción", hint: "Túnel" },
  { location: "Contrabando", category: "Delito", hint: "Frontera" },

  // SITUACIONES COTIDIANAS (HARD)
  { location: "Resaca", category: "Salud", hint: "Lentes" },
  { location: "Friendzone", category: "Relación", hint: "Hermano" },
  { location: "Dieta", category: "Comida", hint: "Lunes" },
  { location: "Atasco", category: "Tráfico", hint: "Bocina" },
  { location: "Ikea", category: "Tienda", hint: "Instrucciones" },
  { location: "Mudanza", category: "Casa", hint: "Cajas" },
  { location: "Reunión de Padres", category: "Escuela", hint: "Notas" },
  { location: "Entrevista", category: "Trabajo", hint: "Corbata" },
  { location: "Ascensor", category: "Edificio", hint: "Charla" },
  { location: "Lunes", category: "Tiempo", hint: "Café" },
  { location: "Fin de Mes", category: "Economía", hint: "Arroz" },
  { location: "Cita a Ciegas", category: "Romance", hint: "Foto" },
  { location: "Divorcio", category: "Legal", hint: "Mitad" },
  { location: "Herencia", category: "Dinero", hint: "Pelea" },
  { location: "Vecino", category: "Persona", hint: "Ruido" },
  { location: "Suegra", category: "Familia", hint: "Domingo" },
  { location: "Examen", category: "Estudio", hint: "Copiar" },
  { location: "Supermercado", category: "Lugar", hint: "Ruedita" },
  { location: "Gimnasio", category: "Deporte", hint: "Enero" },
  { location: "Cajero", category: "Banco", hint: "Clave" },

  // SOBRENATURAL Y TERROR
  { location: "Exorcismo", category: "Terror", hint: "Cama" },
  { location: "Ouija", category: "Juego", hint: "Copa" },
  { location: "Vudú", category: "Magia", hint: "Aguja" },
  { location: "Zombie", category: "Monstruo", hint: "Cerebro" },
  { location: "Hombre Invisible", category: "Ficción", hint: "Ropa" },
  { location: "Vampiro", category: "Mito", hint: "Ajo" },
  { location: "Área 51", category: "Misterio", hint: "Desierto" },
  { location: "Triángulo de las Bermudas", category: "Lugar", hint: "Avión" },
  { location: "Nessie", category: "Leyenda", hint: "Foto" },
  { location: "Medium", category: "Profesión", hint: "Sesión" },
  { location: "Fantasma", category: "Espíritu", hint: "Sábana" },
  { location: "Momia", category: "Egipto", hint: "Papel" },
  { location: "Bruja", category: "Cuento", hint: "Verruga" },
  { location: "Hombre Lobo", category: "Mito", hint: "Plata" },
  { location: "Secta", category: "Grupo", hint: "Líder" },

  // CIENCIA Y UNIVERSO
  { location: "Agujero Negro", category: "Espacio", hint: "Luz" },
  { location: "Schrödinger", category: "Física", hint: "Gato" },
  { location: "Gravedad", category: "Física", hint: "Manzana" },
  { location: "Multiverso", category: "Teoría", hint: "Espejos" },
  { location: "Clon", category: "Genética", hint: "Oveja" },
  { location: "Supernova", category: "Estrella", hint: "Explosión" },
  { location: "Materia Oscura", category: "Espacio", hint: "Invisible" },
  { location: "Evolución", category: "Biología", hint: "Mono" },
  { location: "Big Bang", category: "Origen", hint: "Ruido" },
  { location: "Paradoja", category: "Lógica", hint: "Abuelo" },
  { location: "Astronauta", category: "Profesión", hint: "Pañal" },
  { location: "Marte", category: "Planeta", hint: "Rojo" },
  { location: "Telescopio", category: "Objeto", hint: "Lente" },
  { location: "Laboratorio", category: "Lugar", hint: "Rata" },
  { location: "Virus", category: "Biología", hint: "Corona" },

  // DEPORTES (LATERAL)
  { location: "VAR", category: "Fútbol", hint: "Monitor" },
  { location: "Doping", category: "Deporte", hint: "Orina" },
  { location: "Hooligan", category: "Fútbol", hint: "Bengala" },
  { location: "Muerte Súbita", category: "Regla", hint: "Gol" },
  { location: "Foto Finish", category: "Carrera", hint: "Nariz" },
  { location: "Knockout", category: "Boxeo", hint: "Cuenta" },
  { location: "Autogol", category: "Fútbol", hint: "Vergüenza" },
  { location: "Ola", category: "Estadio", hint: "Público" },
  { location: "Caddie", category: "Golf", hint: "Palos" },
  { location: "Pit Stop", category: "F1", hint: "Llanta" },
  { location: "Árbitro", category: "Fútbol", hint: "Madre" },
  { location: "Mundial", category: "Evento", hint: "Mes" },
  { location: "Messi", category: "Ídolo", hint: "Cabra" },
  { location: "Penalti", category: "Fútbol", hint: "Lotería" },
  { location: "Medalla", category: "Juegos", hint: "Diente" },

  // SOCIEDAD Y CULTURA
  { location: "Vegano", category: "Estilo", hint: "Carne" },
  { location: "Hipster", category: "Tribu", hint: "Vinilo" },
  { location: "Bohemio", category: "Estilo", hint: "Arte" },
  { location: "Yuppie", category: "Tribu", hint: "Bolsa" },
  { location: "Millennial", category: "Generación", hint: "Tostada" },
  { location: "Feminismo", category: "Movimiento", hint: "Pañuelo" },
  { location: "Censura", category: "Política", hint: "Barra" },
  { location: "Huelga", category: "Protesta", hint: "Cartel" },
  { location: "Okupa", category: "Vivienda", hint: "Llave" },
  { location: "Gentrificación", category: "Urbanismo", hint: "Café" },
  { location: "Hippie", category: "Tribu", hint: "Flor" },
  { location: "Punk", category: "Música", hint: "Cresta" },
  { location: "Otaku", category: "Hobby", hint: "Ducha" },
  { location: "Gótico", category: "Estilo", hint: "Negro" },
  { location: "Político", category: "Profesión", hint: "Promesa" },

  // OBJETOS CON TEXTO
  { location: "Ticket", category: "Papel", hint: "Compra" },
  { location: "Pasaporte", category: "Documento", hint: "Sello" },
  { location: "Testamento", category: "Legal", hint: "Herencia" },
  { location: "Diploma", category: "Logro", hint: "Pared" },
  { location: "Multa", category: "Tráfico", hint: "Radar" },
  { location: "Carta de Amor", category: "Romance", hint: "Perfume" },
  { location: "Menú", category: "Restaurante", hint: "Precio" },
  { location: "Diario", category: "Secreto", hint: "Candado" },
  { location: "Mapa", category: "Viaje", hint: "X" },
  { location: "Receta", category: "Cocina", hint: "Letra" },
  { location: "Periódico", category: "Medio", hint: "Ayer" },
  { location: "Libro", category: "Objeto", hint: "Olor" },
  { location: "Billete", category: "Dinero", hint: "Falso" },
  { location: "Tarjeta", category: "Banco", hint: "Chip" },
  { location: "Contrato", category: "Legal", hint: "Firma" },

  // LUGARES ESPECÍFICOS
  { location: "Chernobyl", category: "Lugar", hint: "Radiación" },
  { location: "Las Vegas", category: "Ciudad", hint: "Pecado" },
  { location: "Muralla China", category: "Monumento", hint: "Espacio" },
  { location: "Torre Eiffel", category: "Monumento", hint: "Hierro" },
  { location: "Vaticano", category: "Estado", hint: "Humo" },
  { location: "Polo Norte", category: "Lugar", hint: "Brújula" },
  { location: "Triángulo", category: "Geometría", hint: "Bermudas" },
  { location: "Atlántida", category: "Mito", hint: "Agua" },
  { location: "Olimpo", category: "Mitología", hint: "Nubes" },
  { location: "Infierno", category: "Religión", hint: "Calor" },
  { location: "Cielo", category: "Religión", hint: "Puerta" },
  { location: "Desierto", category: "Bioma", hint: "Espejismo" },
  { location: "Selva", category: "Bioma", hint: "Mosquito" },
  { location: "Playa Nudista", category: "Lugar", hint: "Marca" },
  { location: "Cementerio", category: "Lugar", hint: "Flor" },

  // CUERPO Y MENTE
  { location: "Ego", category: "Psicología", hint: "Globo" },
  { location: "Deja Vu", category: "Mente", hint: "Repetir" },
  { location: "Insomnio", category: "Sueño", hint: "Ovejas" },
  { location: "Adrenalina", category: "Química", hint: "Miedo" },
  { location: "ADN", category: "Biología", hint: "Padre" },
  { location: "Cicatriz", category: "Piel", hint: "Historia" },
  { location: "Tatuaje", category: "Piel", hint: "Nombre" },
  { location: "Gemelos", category: "Familia", hint: "Espejo" },
  { location: "Hipo", category: "Cuerpo", hint: "Susto" },
  { location: "Cosquillas", category: "Sensación", hint: "Pluma" },
  { location: "Cerebro", category: "Órgano", hint: "Arruga" },
  { location: "Corazón", category: "Órgano", hint: "Roto" },
  { location: "Diente", category: "Hueso", hint: "Hada" },
  { location: "Esqueleto", category: "Cuerpo", hint: "Armario" },
  { location: "Ombligo", category: "Cuerpo", hint: "Pelusa" },

  // FIESTA Y NOCHE
  { location: "Borracho", category: "Estado", hint: "Suelo" },
  { location: "After", category: "Fiesta", hint: "Sol" },
  { location: "DJ", category: "Música", hint: "Drop" },
  { location: "Barman", category: "Profesión", hint: "Propina" },
  { location: "Vómito", category: "Acción", hint: "Baño" },
  { location: "Taxi", category: "Transporte", hint: "Vuelto" },
  { location: "Guardarropa", category: "Lugar", hint: "Ticket" },
  { location: "VIP", category: "Zona", hint: "Pulsera" },
  { location: "Karaoke", category: "Actividad", hint: "Gallo" },
  { location: "Despedida de Soltero", category: "Evento", hint: "Enano" },
  { location: "Discoteca", category: "Lugar", hint: "Sello" },
  { location: "Concierto", category: "Evento", hint: "Pogo" },
  { location: "Festival", category: "Música", hint: "Barro" },
  { location: "Rave", category: "Fiesta", hint: "Agua" },
  { location: "Portero", category: "Profesión", hint: "Zapatillas" },

  // ARTE Y CREATIVIDAD
  { location: "Mona Lisa", category: "Arte", hint: "Cejas" },
  { location: "Graffiti", category: "Calle", hint: "Tren" },
  { location: "Mimo", category: "Teatro", hint: "Caja" },
  { location: "Origami", category: "Papel", hint: "Grulla" },
  { location: "Tatuador", category: "Profesión", hint: "Guante" },
  { location: "Poeta", category: "Literatura", hint: "Rima" },
  { location: "Abstracto", category: "Estilo", hint: "Mancha" },
  { location: "Subasta", category: "Negocio", hint: "Martillo" },
  { location: "Museo", category: "Lugar", hint: "Cordón" },
  { location: "Piano", category: "Instrumento", hint: "Cola" },
  { location: "Guitarra", category: "Instrumento", hint: "Fogata" },
  { location: "Batería", category: "Instrumento", hint: "Vecino" },
  { location: "Opera", category: "Música", hint: "Gorda" },
  { location: "Ballet", category: "Danza", hint: "Puntas" },
  { location: "Circo", category: "Espectáculo", hint: "Red" },

  // PROFESIONES EXTRAÑAS
  { location: "Espía", category: "Trabajo", hint: "Micrófono" },
  { location: "Sicario", category: "Crimen", hint: "Moto" },
  { location: "Gigoló", category: "Servicio", hint: "Señora" },
  { location: "Enterrador", category: "Cementerio", hint: "Pala" },
  { location: "Exorcista", category: "Religión", hint: "Vómito" },
  { location: "Domador", category: "Circo", hint: "Silla" },
  { location: "Hacker", category: "Crimen", hint: "Capucha" },
  { location: "Buzo", category: "Mar", hint: "Tubo" },
  { location: "Mimo", category: "Arte", hint: "Hablar" },
  { location: "Payaso", category: "Fiesta", hint: "Globo" },
  { location: "Mago", category: "Espectáculo", hint: "Conejo" },
  { location: "Bombero", category: "Héroe", hint: "Gato" },
  { location: "Presidente", category: "Política", hint: "Avión" },
  { location: "Astrólogo", category: "Creencia", hint: "Horóscopo" },
  { location: "Carnicero", category: "Tienda", hint: "Dedo" },

  // CONCEPTOS DE JUEGO
  { location: "Game Over", category: "Juego", hint: "Continuar" },
  { location: "Noob", category: "Jugador", hint: "Fácil" },
  { location: "Camper", category: "Estrategia", hint: "Esquina" },
  { location: "Boss", category: "Nivel", hint: "Vida" },
  { location: "Cheat", category: "Trampa", hint: "Código" },
  { location: "Respawn", category: "Mecánica", hint: "Cielo" },
  { location: "Skin", category: "Cosmético", hint: "Pago" },
  { location: "Quest", category: "Misión", hint: "NPC" },
  { location: "Loot", category: "Premio", hint: "Suelo" },
  { location: "Speedrun", category: "Estilo", hint: "Reloj" },
  { location: "Joystick", category: "Hardware", hint: "Palanca" },
  { location: "Consola", category: "Hardware", hint: "Cable" },
  { location: "Arcade", category: "Retro", hint: "Ficha" },
  { location: "Tetris", category: "Juego", hint: "Línea" },
  { location: "Mario", category: "Personaje", hint: "Hongo" },

  // ALIMENTOS POLÉMICOS Y CURIOSOS
  { location: "Piña en la Pizza", category: "Debate", hint: "Crimen" },
  { location: "Cilantro", category: "Hierba", hint: "Jabón" },
  { location: "Morcilla", category: "Embutido", hint: "Sangre" },
  { location: "Queso Azul", category: "Comida", hint: "Moho" },
  { location: "Picante", category: "Sabor", hint: "Leche" },
  { location: "Café Descafeinado", category: "Bebida", hint: "Mentira" },
  { location: "Cerveza Sin Alcohol", category: "Bebida", hint: "Jugo" },
  { location: "Tofu", category: "Vegano", hint: "Goma" },
  { location: "Sushi", category: "Comida", hint: "Palitos" },
  { location: "Insectos", category: "Futuro", hint: "Crujiente" },
  { location: "Caviar", category: "Lujo", hint: "Huevo" },
  { location: "Trufa", category: "Lujo", hint: "Cerdo" },
  { location: "Ostra", category: "Mar", hint: "Moco" },
  { location: "Durian", category: "Fruta", hint: "Olor" },
  { location: "Kebab", category: "Noche", hint: "Salsa" },

  // OFICINA Y VIDA ADULTA
  { location: "Excel", category: "Software", hint: "Celda" },
  { location: "Impresora", category: "Hardware", hint: "Tinta" },
  { location: "Café", category: "Oficina", hint: "Motor" },
  { location: "Reunión", category: "Trabajo", hint: "Dormir" },
  { location: "Jefe", category: "Persona", hint: "Grito" },
  { location: "Pasantía", category: "Trabajo", hint: "Gratis" },
  { location: "Aguinaldo", category: "Dinero", hint: "Regalos" },
  { location: "Tupper", category: "Comida", hint: "Mamá" },
  { location: "Aire Acondicionado", category: "Oficina", hint: "Pelea" },
  { location: "Lunes", category: "Día", hint: "Dieta" },
  { location: "Viernes", category: "Día", hint: "Casual" },
  { location: "Vacaciones", category: "Tiempo", hint: "Cortas" },
  { location: "Jubilación", category: "Futuro", hint: "Lejos" },
  { location: "Impuestos", category: "Dinero", hint: "Robo" },
  { location: "Hipoteca", category: "Casa", hint: "Vida" },

  // VIAJES Y TRANSPORTE
  { location: "Avión", category: "Transporte", hint: "Comida" },
  { location: "Turbulencia", category: "Vuelo", hint: "Jugo" },
  { location: "Pasaporte", category: "Viaje", hint: "Foto" },
  { location: "Hostel", category: "Alojamiento", hint: "Ronquido" },
  { location: "Camping", category: "Viaje", hint: "Mosquito" },
  { location: "Crucero", category: "Barco", hint: "Viejo" },
  { location: "Metro", category: "Ciudad", hint: "Olor" },
  { location: "Uber", category: "App", hint: "Agua" },
  { location: "Bicicleta", category: "Transporte", hint: "Casco" },
  { location: "Autostop", category: "Viaje", hint: "Dedo" },
  { location: "Maleta", category: "Objeto", hint: "Ruedas" },
  { location: "Jet Lag", category: "Salud", hint: "Hora" },
  { location: "Souvenir", category: "Regalo", hint: "Imán" },
  { location: "Aduana", category: "Frontera", hint: "Guante" },
  { location: "Mapa", category: "Objeto", hint: "Google" },

  // NATURALEZA PELIGROSA
  { location: "Volcán", category: "Desastre", hint: "Pompeya" },
  { location: "Tsunami", category: "Mar", hint: "Muro" },
  { location: "Terremoto", category: "Desastre", hint: "Mesa" },
  { location: "Huracán", category: "Clima", hint: "Nombre" },
  { location: "Tornado", category: "Clima", hint: "Vaca" },
  { location: "Arenas Movedizas", category: "Cine", hint: "Quieto" },
  { location: "Avalancha", category: "Nieve", hint: "Grito" },
  { location: "Rayo", category: "Clima", hint: "Árbol" },
  { location: "Inundación", category: "Agua", hint: "Techo" },
  { location: "Meteorito", category: "Espacio", hint: "Dino" },
  { location: "Oso", category: "Animal", hint: "Miel" },
  { location: "Tiburón", category: "Animal", hint: "Música" },
  { location: "Serpiente", category: "Animal", hint: "Manzana" },
  { location: "Araña", category: "Animal", hint: "Esquina" },
  { location: "Abeja", category: "Insecto", hint: "Reina" },

  // MODA Y ESTILO
  { location: "Crocs", category: "Calzado", hint: "Agujeros" },
  { location: "Tacones", category: "Calzado", hint: "Dolor" },
  { location: "Corbata", category: "Ropa", hint: "Nudo" },
  { location: "Bikini", category: "Ropa", hint: "Cera" },
  { location: "Tanga", category: "Ropa", hint: "Hilo" },
  { location: "Peluca", category: "Pelo", hint: "Viento" },
  { location: "Lentes", category: "Accesorio", hint: "Vaho" },
  { location: "Barba", category: "Pelo", hint: "Sopa" },
  { location: "Bolso", category: "Accesorio", hint: "Pozo" },
  { location: "Pijama", category: "Ropa", hint: "Calle" },
  { location: "Calcetines", category: "Ropa", hint: "Tomate" },
  { location: "Cinturón", category: "Accesorio", hint: "Padre" },
  { location: "Vestido de Novia", category: "Ropa", hint: "Blanco" },
  { location: "Uniforme", category: "Ropa", hint: "Colegio" },
  { location: "Disfraz", category: "Ropa", hint: "Octubre" },

  // --- NUEVAS ENTRADAS (300 ADICIONALES) ---
  
  // MEDICINA Y HOSPITAL
  { location: "Anestesia", category: "Medicina", hint: "Dormir" },
  { location: "Placebo", category: "Medicina", hint: "Mentira" },
  { location: "Cirujano", category: "Profesión", hint: "Bisturí" },
  { location: "Ambulancia", category: "Emergencia", hint: "Sirena" },
  { location: "Yeso", category: "Lesión", hint: "Firma" },
  { location: "Rayos X", category: "Medicina", hint: "Hueso" },
  { location: "Inyección", category: "Medicina", hint: "Aguja" },
  { location: "Sala de Espera", category: "Hospital", hint: "Revista" },
  { location: "Estetoscopio", category: "Herramienta", hint: "Pecho" },
  { location: "Camilla", category: "Hospital", hint: "Ruedas" },
  { location: "Coma", category: "Estado", hint: "Largo" },
  { location: "Parto", category: "Hospital", hint: "Grito" },
  { location: "Donante", category: "Medicina", hint: "Sangre" },
  { location: "Morgue", category: "Hospital", hint: "Frío" },
  { location: "Farmacia", category: "Lugar", hint: "Receta" },

  // FOBIAS Y MIEDOS
  { location: "Claustrofobia", category: "Miedo", hint: "Ascensor" },
  { location: "Aracnofobia", category: "Miedo", hint: "Patas" },
  { location: "Acrofobia", category: "Miedo", hint: "Altura" },
  { location: "Oscuridad", category: "Miedo", hint: "Luz" },
  { location: "Payasos", category: "Miedo", hint: "Sonrisa" },
  { location: "Soledad", category: "Miedo", hint: "Silencio" },
  { location: "Muerte", category: "Miedo", hint: "Fin" },
  { location: "Agujas", category: "Miedo", hint: "Sangre" },
  { location: "Aviones", category: "Miedo", hint: "Volar" },
  { location: "Gérmenes", category: "Miedo", hint: "Jabón" },

  // MÚSICA Y GÉNEROS
  { location: "Reggaeton", category: "Música", hint: "Perreo" },
  { location: "K-Pop", category: "Música", hint: "Corea" },
  { location: "Jazz", category: "Música", hint: "Saxofón" },
  { location: "Metal", category: "Música", hint: "Grito" },
  { location: "Mariachi", category: "Música", hint: "Trompeta" },
  { location: "Rap", category: "Música", hint: "Rima" },
  { location: "Techno", category: "Música", hint: "Repetir" },
  { location: "Salsa", category: "Baile", hint: "Pareja" },
  { location: "Tango", category: "Baile", hint: "Rosa" },
  { location: "Vinilo", category: "Objeto", hint: "Aguja" },
  { location: "Auriculares", category: "Objeto", hint: "Cable" },
  { location: "Spotify", category: "App", hint: "Verde" },
  { location: "Videoclip", category: "Música", hint: "MTV" },
  { location: "Auto-Tune", category: "Efecto", hint: "Robot" },
  { location: "Playback", category: "Actuación", hint: "Falso" },

  // CRIMEN ORGANIZADO
  { location: "Lavado de Dinero", category: "Crimen", hint: "Limpio" },
  { location: "Cartel", category: "Crimen", hint: "Drogas" },
  { location: "Soborno", category: "Corrupción", hint: "Sobre" },
  { location: "Chantaje", category: "Crimen", hint: "Secreto" },
  { location: "Falsificación", category: "Crimen", hint: "Copia" },
  { location: "Robo de Identidad", category: "Crimen", hint: "Nombre" },
  { location: "Piratería", category: "Digital", hint: "Barco" },
  { location: "Testaferro", category: "Legal", hint: "Nombre" },
  { location: "Desfalco", category: "Dinero", hint: "Falta" },
  { location: "Cibercrimen", category: "Digital", hint: "Virus" },

  // FANTASÍA Y ROL
  { location: "Dragón", category: "Criatura", hint: "Escamas" },
  { location: "Elfo", category: "Raza", hint: "Orejas" },
  { location: "Orco", category: "Raza", hint: "Verde" },
  { location: "Poción", category: "Magia", hint: "Beber" },
  { location: "Hechizo", category: "Magia", hint: "Palabras" },
  { location: "Mazmorra", category: "Lugar", hint: "Calabozo" },
  { location: "Tesoro", category: "Objeto", hint: "Cofre" },
  { location: "Espada", category: "Arma", hint: "Filo" },
  { location: "Escudo", category: "Defensa", hint: "Madera" },
  { location: "Portal", category: "Viaje", hint: "Otro" },
  { location: "Mana", category: "Energía", hint: "Azul" },
  { location: "Nigromante", category: "Mago", hint: "Muertos" },
  { location: "Gólem", category: "Criatura", hint: "Piedra" },
  { location: "Hada", category: "Criatura", hint: "Polvo" },
  { location: "Unicornio", category: "Criatura", hint: "Arcoiris" },

  // CIUDAD Y URBANISMO
  { location: "Rascacielos", category: "Edificio", hint: "Nube" },
  { location: "Alcantarilla", category: "Ciudad", hint: "Tortuga" },
  { location: "Semáforo", category: "Tráfico", hint: "Color" },
  { location: "Paso de Cebra", category: "Calle", hint: "Rayas" },
  { location: "Farola", category: "Calle", hint: "Noche" },
  { location: "Banco", category: "Mobiliario", hint: "Sentarse" },
  { location: "Fuente", category: "Decoración", hint: "Moneda" },
  { location: "Callejón", category: "Ciudad", hint: "Salida" },
  { location: "Rotonda", category: "Tráfico", hint: "Vuelta" },
  { location: "Parking", category: "Lugar", hint: "Subsuelo" },
  { location: "Puente", category: "Estructura", hint: "Cruzar" },
  { location: "Túnel", category: "Estructura", hint: "Oscuro" },
  { location: "Barrio Chino", category: "Lugar", hint: "Dragón" },
  { location: "Suburbio", category: "Zona", hint: "Casa" },
  { location: "Obra", category: "Ciudad", hint: "Grúa" },

  // COSAS DE CASA
  { location: "Sótano", category: "Casa", hint: "Miedo" },
  { location: "Ático", category: "Casa", hint: "Polvo" },
  { location: "Persiana", category: "Ventana", hint: "Sol" },
  { location: "Felpudo", category: "Entrada", hint: "Pies" },
  { location: "Grifo", category: "Baño", hint: "Gota" },
  { location: "Enchufe", category: "Electricidad", hint: "Dedo" },
  { location: "Bombilla", category: "Luz", hint: "Idea" },
  { location: "Cojín", category: "Sofá", hint: "Guerra" },
  { location: "Mando", category: "TV", hint: "Pilas" },
  { location: "Cajón Desastre", category: "Mueble", hint: "Todo" },
  { location: "Escoba", category: "Limpieza", hint: "Volar" },
  { location: "Fregona", category: "Limpieza", hint: "Cubo" },
  { location: "Microondas", category: "Cocina", hint: "Girar" },
  { location: "Nevera", category: "Cocina", hint: "Imán" },
  { location: "Espejo", category: "Baño", hint: "Vaho" },

  // ESCUELA Y EDUCACIÓN
  { location: "Pizarra", category: "Aula", hint: "Tiza" },
  { location: "Recreo", category: "Tiempo", hint: "Patio" },
  { location: "Chuletario", category: "Trampa", hint: "Pequeño" },
  { location: "Borrador", category: "Útil", hint: "Polvo" },
  { location: "Mochila", category: "Útil", hint: "Peso" },
  { location: "Comedor", category: "Lugar", hint: "Bandeja" },
  { location: "Excursión", category: "Evento", hint: "Autobús" },
  { location: "Castigo", category: "Acción", hint: "Pared" },
  { location: "Nota", category: "Calificación", hint: "Rojo" },
  { location: "Profesor", category: "Persona", hint: "Manzana" },
  { location: "Tesis", category: "Universidad", hint: "Estrés" },
  { location: "Graduación", category: "Evento", hint: "Gorro" },
  { location: "Beca", category: "Dinero", hint: "Estudio" },
  { location: "Novatada", category: "Ritual", hint: "Vergüenza" },
  { location: "Campana", category: "Objeto", hint: "Salida" },

  // DEPORTES (MÁS VARIEDAD)
  { location: "Sumo", category: "Lucha", hint: "Gordo" },
  { location: "Esgrima", category: "Deporte", hint: "Espada" },
  { location: "Curling", category: "Deporte", hint: "Escoba" },
  { location: "Waterpolo", category: "Deporte", hint: "Gorro" },
  { location: "Rugby", category: "Deporte", hint: "Ovalo" },
  { location: "Skate", category: "Deporte", hint: "Ruedas" },
  { location: "Parkour", category: "Urbano", hint: "Salto" },
  { location: "Dardos", category: "Juego", hint: "Diana" },
  { location: "Billar", category: "Juego", hint: "Taco" },
  { location: "Bolos", category: "Juego", hint: "Chuza" },
  { location: "Petanca", category: "Juego", hint: "Abuelo" },
  { location: "Paintball", category: "Juego", hint: "Pintura" },
  { location: "Paracaidismo", category: "Extremo", hint: "Mochila" },
  { location: "Puenting", category: "Extremo", hint: "Cuerda" },
  { location: "Rally", category: "Motor", hint: "Tierra" },

  // FIESTAS Y EVENTOS
  { location: "Halloween", category: "Fiesta", hint: "Dulce" },
  { location: "San Valentín", category: "Fiesta", hint: "Flecha" },
  { location: "Carnaval", category: "Fiesta", hint: "Máscara" },
  { location: "Año Nuevo", category: "Fiesta", hint: "Uvas" },
  { location: "Baby Shower", category: "Fiesta", hint: "Pañal" },
  { location: "Funeral", category: "Evento", hint: "Negro" },
  { location: "Boda", category: "Evento", hint: "Arroz" },
  { location: "Cumpleaños", category: "Fiesta", hint: "Vela" },
  { location: "Piñata", category: "Objeto", hint: "Palo" },
  { location: "Confeti", category: "Decoración", hint: "Suelo" },
  { location: "Brindis", category: "Acción", hint: "Copa" },
  { location: "Resaca", category: "Consecuencia", hint: "Agua" },
  { location: "Cotillón", category: "Fiesta", hint: "Bolsa" },
  { location: "Amigo Invisible", category: "Juego", hint: "Secreto" },
  { location: "Desfile", category: "Evento", hint: "Carroza" },

  // CONCEPTOS FILOSÓFICOS/ABSTRACTOS
  { location: "Karma", category: "Concepto", hint: "Vuelta" },
  { location: "Destino", category: "Concepto", hint: "Escrito" },
  { location: "Utopía", category: "Concepto", hint: "Perfecto" },
  { location: "Nihilismo", category: "Filosofía", hint: "Nada" },
  { location: "Caos", category: "Concepto", hint: "Orden" },
  { location: "Tiempo", category: "Física", hint: "Reloj" },
  { location: "Infinito", category: "Concepto", hint: "Ocho" },
  { location: "Silencio", category: "Sonido", hint: "Ruido" },
  { location: "Esperanza", category: "Sentimiento", hint: "Verde" },
  { location: "Verdad", category: "Concepto", hint: "Duele" },
  { location: "Mentira", category: "Concepto", hint: "Nariz" },
  { location: "Libertad", category: "Concepto", hint: "Estatua" },
  { location: "Suerte", category: "Azar", hint: "Trebol" },
  { location: "Fama", category: "Social", hint: "Efímera" },
  { location: "Poder", category: "Social", hint: "Trono" },

  // ANIMALES CURIOSOS
  { location: "Ornitorrinco", category: "Animal", hint: "Agente" },
  { location: "Camaleón", category: "Reptil", hint: "Color" },
  { location: "Perezoso", category: "Animal", hint: "Lento" },
  { location: "Pingüino", category: "Ave", hint: "Esmoquin" },
  { location: "Canguro", category: "Animal", hint: "Bolsa" },
  { location: "Pulpo", category: "Mar", hint: "Tinta" },
  { location: "Luciérnaga", category: "Insecto", hint: "Luz" },
  { location: "Medusa", category: "Mar", hint: "Picar" },
  { location: "Murciélago", category: "Animal", hint: "Batman" },
  { location: "Loro", category: "Ave", hint: "Repetir" },
  { location: "Hiena", category: "Animal", hint: "Risa" },
  { location: "Topo", category: "Animal", hint: "Ciego" },
  { location: "Pavo Real", category: "Ave", hint: "Ojos" },
  { location: "Mosquito", category: "Insecto", hint: "Zumbido" },
  { location: "Hormiga", category: "Insecto", hint: "Fuerza" },

  // COMIDA RÁPIDA Y SNACKS
  { location: "Hamburguesa", category: "Comida", hint: "Payaso" },
  { location: "Papas Fritas", category: "Comida", hint: "Ketchup" },
  { location: "Nuggets", category: "Comida", hint: "Pollo" },
  { location: "Donut", category: "Dulce", hint: "Policía" },
  { location: "Nachos", category: "Snack", hint: "Queso" },
  { location: "Chicle", category: "Dulce", hint: "Globo" },
  { location: "Piruleta", category: "Dulce", hint: "Palo" },
  { location: "Refresco", category: "Bebida", hint: "Gas" },
  { location: "Batido", category: "Bebida", hint: "Pajita" },
  { location: "Taco Bell", category: "Restaurante", hint: "Baño" },
  { location: "Cajita Feliz", category: "Comida", hint: "Juguete" },
  { location: "Autoservicio", category: "Servicio", hint: "Coche" },
  { location: "Buffet Libre", category: "Restaurante", hint: "Todo" },
  { location: "Food Truck", category: "Restaurante", hint: "Calle" },
  { location: "Delivery", category: "Servicio", hint: "Moto" },

  // HERRAMIENTAS Y BRICOLAJE
  { location: "Martillo", category: "Herramienta", hint: "Thor" },
  { location: "Destornillador", category: "Herramienta", hint: "Cruz" },
  { location: "Sierra", category: "Herramienta", hint: "Polvo" },
  { location: "Cinta Métrica", category: "Medida", hint: "Enrollar" },
  { location: "Taladro", category: "Herramienta", hint: "Vecino" },
  { location: "Llave Inglesa", category: "Herramienta", hint: "Fontanero" },
  { location: "Cinta Aislante", category: "Material", hint: "Negra" },
  { location: "Pegamento", category: "Material", hint: "Oler" },
  { location: "Lija", category: "Material", hint: "Raspar" },
  { location: "Nivel", category: "Herramienta", hint: "Burbuja" },
  { location: "Tuerca", category: "Pieza", hint: "Tornillo" },
  { location: "Clavo", category: "Pieza", hint: "Pared" },
  { location: "Escalera", category: "Objeto", hint: "Mala Suerte" },
  { location: "Casco", category: "Seguridad", hint: "Amarillo" },
  { location: "Caja de Herramientas", category: "Objeto", hint: "Pesada" },

  // CULTURA POP Y MEMES
  { location: "Rickroll", category: "Internet", hint: "Never" },
  { location: "Shrek", category: "Cine", hint: "Cebolla" },
  { location: "Vengadores", category: "Cine", hint: "Chisquido" },
  { location: "Juego de Tronos", category: "TV", hint: "Invierno" },
  { location: "Simpsons", category: "TV", hint: "Amarillo" },
  { location: "Pokémon", category: "Juego", hint: "Bola" },
  { location: "Minecraft", category: "Juego", hint: "Cubo" },
  { location: "Fortnite", category: "Juego", hint: "Baile" },
  { location: "Netflix", category: "Servicio", hint: "Tudum" },
  { location: "Disney", category: "Empresa", hint: "Ratón" },
  { location: "Star Wars", category: "Cine", hint: "Padre" },
  { location: "Harry Potter", category: "Cine", hint: "Cicartiz" },
  { location: "Barbie", category: "Juguete", hint: "Rosa" },
  { location: "Lego", category: "Juguete", hint: "Pie" },
  { location: "Funko", category: "Coleccionable", hint: "Cabeza" },

  // LUGARES DE VACACIONES
  { location: "Spa", category: "Relax", hint: "Pepino" },
  { location: "Crucero", category: "Barco", hint: "Buffet" },
  { location: "Safari", category: "Viaje", hint: "León" },
  { location: "Disneyland", category: "Parque", hint: "Castillo" },
  { location: "Montaña Rusa", category: "Atracción", hint: "Vómito" },
  { location: "Hotel", category: "Alojamiento", hint: "Tarjeta" },
  { location: "Airbnb", category: "Alojamiento", hint: "Dueño" },
  { location: "Chiringuito", category: "Playa", hint: "Caña" },
  { location: "Piscina", category: "Lugar", hint: "Cloro" },
  { location: "Estación de Esquí", category: "Lugar", hint: "Forfait" },
  { location: "Caravana", category: "Vehículo", hint: "Casa" },
  { location: "Tienda de Campaña", category: "Camping", hint: "Cremallera" },
  { location: "Hamaca", category: "Mueble", hint: "Árbol" },
  { location: "Duty Free", category: "Aeropuerto", hint: "Perfume" },
  { location: "Agencia de Viajes", category: "Negocio", hint: "Folleto" },

  // OBJETOS RETRO
  { location: "Cassette", category: "Objeto", hint: "Boli" },
  { location: "VHS", category: "Objeto", hint: "Rebobinar" },
  { location: "Walkman", category: "Tech", hint: "Pilas" },
  { location: "Tamagotchi", category: "Juguete", hint: "Morir" },
  { location: "Game Boy", category: "Consola", hint: "Lupa" },
  { location: "Disquete", category: "Tech", hint: "Guardar" },
  { location: "Cabina Telefónica", category: "Calle", hint: "Superman" },
  { location: "Máquina de Escribir", category: "Objeto", hint: "Tinta" },
  { location: "Cámara de Rollo", category: "Foto", hint: "Revelar" },
  { location: "Carta", category: "Correo", hint: "Sello" },
  { location: "Fax", category: "Oficina", hint: "Ruido" },
  { location: "Beeper", category: "Tech", hint: "Médico" },
  { location: "Enciclopedia", category: "Libro", hint: "Vendedor" },
  { location: "Guía Telefónica", category: "Libro", hint: "Páginas" },
  { location: "MP3", category: "Tech", hint: "Canciones" },

  // ELEMENTOS DE LA NATURALEZA
  { location: "Arcoiris", category: "Clima", hint: "Olla" },
  { location: "Niebla", category: "Clima", hint: "Ciego" },
  { location: "Granizo", category: "Clima", hint: "Hielo" },
  { location: "Aurora Boreal", category: "Cielo", hint: "Verde" },
  { location: "Cactus", category: "Planta", hint: "Pincho" },
  { location: "Bonsái", category: "Planta", hint: "Pequeño" },
  { location: "Coral", category: "Mar", hint: "Arrecife" },
  { location: "Iceberg", category: "Mar", hint: "Punta" },
  { location: "Géiser", category: "Tierra", hint: "Agua" },
  { location: "Arena", category: "Playa", hint: "Reloj" },
  { location: "Barro", category: "Tierra", hint: "Cerdo" },
  { location: "Cueva", category: "Lugar", hint: "Eco" },
  { location: "Cascada", category: "Agua", hint: "Caída" },
  { location: "Pantano", category: "Lugar", hint: "Shrek" },
  { location: "Setas", category: "Planta", hint: "Pitufo" },

  // ROPA Y ACCESORIOS (EXTRA)
  { location: "Bufanda", category: "Ropa", hint: "Cuello" },
  { location: "Guantes", category: "Ropa", hint: "Huellas" },
  { location: "Paraguas", category: "Accesorio", hint: "Mala Suerte" },
  { location: "Chistera", category: "Sombrero", hint: "Conejo" },
  { location: "Boina", category: "Sombrero", hint: "Francés" },
  { location: "Zuecos", category: "Calzado", hint: "Madera" },
  { location: "Chanclas", category: "Calzado", hint: "Madre" },
  { location: "Tirantes", category: "Ropa", hint: "Pantalón" },
  { location: "Gemelos", category: "Accesorio", hint: "Camisa" },
  { location: "Abanico", category: "Accesorio", hint: "Aire" },
  { location: "Monóculo", category: "Accesorio", hint: "Ojo" },
  { location: "Capa", category: "Ropa", hint: "Héroe" },
  { location: "Chaleco Antibalas", category: "Seguridad", hint: "Kevlar" },
  { location: "Kimono", category: "Ropa", hint: "Japón" },
  { location: "Falda Escocesa", category: "Ropa", hint: "Cuadros" }
];

// --- GESTIÓN INTELIGENTE DE DATOS OFFLINE ---

const resetOfflineIndices = () => {
    // Llenamos el array con índices [0, 1, 2, ... N]
    availableOfflineIndices = Array.from({ length: OFFLINE_DATASET.length }, (_, i) => i);
};

const getUniqueOfflineScenario = (): GameScenario => {
    // Si se acabaron las palabras, reiniciamos la baraja
    if (availableOfflineIndices.length === 0) {
        resetOfflineIndices();
    }

    // Seleccionamos un índice aleatorio de los disponibles
    const randomIndex = Math.floor(Math.random() * availableOfflineIndices.length);
    const scenarioIndex = availableOfflineIndices[randomIndex];

    // Eliminamos ese índice para no repetir
    availableOfflineIndices.splice(randomIndex, 1);

    return OFFLINE_DATASET[scenarioIndex];
};


// Categorías para la IA (Solo se usan si hay API Key válida y Cuota)
const AI_CATEGORIES = [
  "Fútbol y Estadios", "Cine y Rodajes", "Festival de Música", "Deportes Extremos",
  "Matemáticas", "Laboratorio", "Vida Universitaria", "Historia", "El Espacio",
  "Museo de Arte", "Filosofía", "Mitología", "Gimnasio", "Supermercado",
  "Transporte Público", "Redes Sociales", "Restaurante", "Oficina",
  "Crimen", "Apocalipsis", "Citas", "Política"
];

// Variable para almacenar la promesa de la generación en segundo plano
let prefetchPromise: Promise<GameScenario> | null = null;

// Lógica interna de llamada a la API
const fetchFromGemini = async (): Promise<GameScenario> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.log("Modo Offline: Usando base de datos local.");
    return getUniqueOfflineScenario();
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const selectedTheme = AI_CATEGORIES[Math.floor(Math.random() * AI_CATEGORIES.length)];

    const prompt = `Juego 'El Impostor'. Tema: "${selectedTheme}".
    Genera JSON: { "location": "Palabra Secreta (Lugar/Objeto/Concepto)", "category": "Categoría", "hint": "Pista (1 sola palabra, pensamiento lateral)" }
    Ejemplo: { "location": "Subasta", "category": "Arte", "hint": "Martillo" }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 1.3,
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No text returned");

    return JSON.parse(jsonText) as GameScenario;

  } catch (error: any) {
    // Detectar error de cuota (429) explícitamente
    const isQuotaError = 
        error?.status === 429 || 
        error?.code === 429 || 
        (error?.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')));

    if (isQuotaError) {
        console.warn("⚠️ Cuota de IA excedida. Cambiando a Modo Offline sin repeticiones.");
    } else {
        console.error("❌ Error de red/API. Usando respaldo local.", error);
    }
    
    // Retornamos escenario único de la base de datos local
    return getUniqueOfflineScenario();
  }
};

// Función para iniciar la carga antes de tiempo
export const prefetchScenario = () => {
  // Inicializar índices si es la primera vez
  if (availableOfflineIndices.length === 0 && OFFLINE_DATASET.length > 0) {
      // Solo inicializamos si realmente está vacío (arranque app), no si se vació por uso (eso lo maneja getUniqueOfflineScenario)
      // Pero como getUnique lo maneja, aquí solo nos aseguramos de no romper nada.
      // Dejamos que getUniqueOfflineScenario maneje la lógica de barajado.
  }

  if (!prefetchPromise) {
    prefetchPromise = fetchFromGemini();
  }
};

export const generateGameScenario = async (): Promise<GameScenario> => {
  const result = await (prefetchPromise || fetchFromGemini());
  prefetchPromise = null;
  return result;
};