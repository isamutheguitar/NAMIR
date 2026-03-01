/**
 * Maps common domains to their short abbreviations.
 */
export const getDomainAbbreviation = (url: string): string => {
    try {
        const domain = new URL(url).hostname.toLowerCase();

        const abbreviations: { [key: string]: string } = {
            'tonehunt.org': 'TH',
            'facebook.com': 'FB',
            'github.com': 'GH',
            'gumroad.com': 'GR',
            'dropbox.com': 'DB',
            'drive.google.com': 'GD',
            'neuralampmodeler.com': 'NAM',
            'amperic.com': 'AMP'
        };

        // Check for exact match or suffix
        for (const [key, value] of Object.entries(abbreviations)) {
            if (domain === key || domain.endsWith('.' + key)) {
                return value;
            }
        }

        // Default: take first 2 letters of main domain part
        const parts = domain.split('.');
        const mainPart = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
        return mainPart ? mainPart.substring(0, 2).toUpperCase() : 'NA';
    } catch (e) {
        return 'NA';
    }
};
