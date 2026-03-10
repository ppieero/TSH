import unicodedata
import re


def normalize_word(word: str) -> str:
    """Normalize word: lowercase, remove accents, strip whitespace"""
    word = word.lower().strip()
    # Remove accents
    nfd = unicodedata.normalize('NFD', word)
    word = ''.join(c for c in nfd if unicodedata.category(c) != 'Mn')
    # Remove punctuation
    word = re.sub(r'[^a-z]', '', word)
    return word


# All 17 phonological patterns with metadata
PHONOLOGICAL_PATTERNS = {
    'EM-C1': {
        'name': 'Omisión de coda nasal',
        'category': 'omission',
        'description': 'El niño omite la consonante nasal (/m/, /n/, /ñ/) al final de sílaba.',
        'typical_age_max_months': 36,  # Usually resolved by 3 years
    },
    'EM-C2': {
        'name': 'Omisión de coda sibilante',
        'category': 'omission',
        'description': 'El niño omite el sonido /s/ o /z/ al final de sílaba.',
        'typical_age_max_months': 48,
    },
    'EM-C3': {
        'name': 'Omisión de coda líquida',
        'category': 'omission',
        'description': 'El niño omite los sonidos /l/ o /r/ al final de sílaba.',
        'typical_age_max_months': 48,
    },
    'EM-G': {
        'name': 'Reducción de grupo consonántico',
        'category': 'omission',
        'description': 'El niño simplifica grupos consonánticos (br, tr, fl, pl, etc.) omitiendo uno.',
        'typical_age_max_months': 60,
    },
    'EM-RD': {
        'name': 'Reducción de diptongo',
        'category': 'omission',
        'description': 'El niño simplifica los diptongos (ie, ue, ai, etc.) a una sola vocal.',
        'typical_age_max_months': 48,
    },
    'EM-MT': {
        'name': 'Reducción metrical (omisión de sílaba)',
        'category': 'omission',
        'description': 'El niño omite una sílaba de palabras largas o complejas.',
        'typical_age_max_months': 48,
    },
    'EM-M': {
        'name': 'Metátesis',
        'category': 'omission',
        'description': 'El niño cambia el orden de los segmentos en la palabra.',
        'typical_age_max_months': 54,
    },
    'EA-N': {
        'name': 'Asimilación nasal',
        'category': 'assimilation',
        'description': 'Una consonante adquiere rasgos nasales por influencia de otra nasal cercana.',
        'typical_age_max_months': 36,
    },
    'EA-L': {
        'name': 'Asimilación labial',
        'category': 'assimilation',
        'description': 'Una consonante adquiere rasgos labiales por influencia de otra consonante labial.',
        'typical_age_max_months': 36,
    },
    'EA-D': {
        'name': 'Asimilación dental/alveolar',
        'category': 'assimilation',
        'description': 'Una consonante adquiere rasgos dentales o alveolares por influencia de otra.',
        'typical_age_max_months': 36,
    },
    'ES-O': {
        'name': 'Sustitución de oclusivas',
        'category': 'substitution',
        'description': 'Sustitución entre consonantes oclusivas (p/b/t/d/k/g).',
        'typical_age_max_months': 48,
    },
    'ES-F': {
        'name': 'Sustitución de fricativas',
        'category': 'substitution',
        'description': 'Sustitución de consonantes fricativas (/s/, /f/, /x/).',
        'typical_age_max_months': 60,
    },
    'ES-P': {
        'name': 'Sustitución de palatales',
        'category': 'substitution',
        'description': 'Sustitución de consonantes palatales (/ʎ/, /ʝ/, /tʃ/).',
        'typical_age_max_months': 60,
    },
    'ES-SL': {
        'name': 'Sustitución de líquidas (confusión l/r)',
        'category': 'substitution',
        'description': 'Confusión entre los sonidos /l/ y /r/.',
        'typical_age_max_months': 60,
    },
    'ES-SLNL': {
        'name': 'Sustitución semiconsonante-lateral',
        'category': 'substitution',
        'description': 'Sustitución de /ʎ/ o /ʝ/ por otro sonido (r, l, d).',
        'typical_age_max_months': 60,
    },
    'ES-PS': {
        'name': 'Sustitución obstruyente por sonora',
        'category': 'substitution',
        'description': 'Sonorización de consonantes sordas (p→b, t→d, k→g).',
        'typical_age_max_months': 42,
    },
}

# Example words for each pattern
PATTERN_EXAMPLES = {
    'EM-C1': [('pan', 'pa'), ('tren', 'tre'), ('manta', 'mata'), ('campo', 'capo')],
    'EM-C2': [('dos', 'do'), ('mes', 'me'), ('pasta', 'pata'), ('mismo', 'mimo')],
    'EM-C3': [('sol', 'so'), ('mar', 'ma'), ('falda', 'fada'), ('árbol', 'abo')],
    'EM-G': [('flor', 'lor'), ('tren', 'ren'), ('brazo', 'razo'), ('plato', 'pato'), ('globo', 'gobo')],
    'EM-RD': [('tierra', 'tera'), ('puerta', 'peta'), ('fuego', 'fego'), ('piedra', 'peda')],
    'EM-MT': [('teléfono', 'téfono'), ('mariposa', 'maposa'), ('elefante', 'efante'), ('chocolate', 'colate')],
    'EM-M': [('cocodrilo', 'crododilo'), ('peligro', 'perligo')],
    'EA-N': [('boca', 'moca'), ('dedo', 'neno'), ('gato', 'nato')],
    'EA-L': [('cama', 'pama'), ('gato', 'bato'), ('dedo', 'bebo')],
    'EA-D': [('casa', 'tasa'), ('dato', 'tato'), ('leche', 'lele')],
    'ES-O': [('perro', 'berro'), ('taza', 'daza'), ('cama', 'gama')],
    'ES-F': [('sopa', 'fopa'), ('zapato', 'fapato')],
    'ES-P': [('llave', 'yave'), ('pollo', 'poyo'), ('lluvia', 'yuvia')],
    'ES-SL': [('sol', 'sor'), ('árbol', 'árbor'), ('reloj', 'rerol')],
    'ES-SLNL': [('lluvia', 'ruvia'), ('llave', 'rave'), ('llama', 'rama')],
    'ES-PS': [('taza', 'daza'), ('pato', 'bato'), ('coche', 'goche')],
}
