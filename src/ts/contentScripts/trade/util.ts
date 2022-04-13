/**
 * @description Converts a RLG Formatted relative timestamp string to a Date object
 * @param input The RLG formatted timestamp string, such as "2 hours, 1 minutes, 31 seconds ago"
 * @returns The date that the string refers to
 */
export default function parseTimeString(input: string) {
    input = input.replace(' ago', '');
    let relativeTime = 0;
    const parts = input.split(', ').map(s => s.trim());
    parts.forEach(part => {
        const digits = parseInt((part.match(/[0-9]+/) || ['0'])[0], 10) || 0;
        let unit = (part.match(/[a-z]+/) || [''])[0];
        // Remove Trailing 's'
        if (unit.endsWith('s')) unit = unit.replace(/s$/, '');
        switch (unit) {
            case 'second':
                relativeTime += digits * 1000;
                break;
            case 'minute':
                relativeTime += digits * 1000 * 60;
                break;
            case 'hour':
                relativeTime += digits * 1000 * 60 * 60;
                break;
            case 'day':
                relativeTime += digits * 1000 * 60 * 60 * 24;
                break;
        }
    });
    return Date.now() - relativeTime;
}
