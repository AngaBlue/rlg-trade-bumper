import { theme } from '@chakra-ui/react';

export default {
    ...theme,
    colors: {
        ...theme.colors,
        brand: {
            50: '#f8e3ff',
            100: '#deb2ff',
            200: '#c87fff',
            300: '#b14cff',
            400: '#9a1aff',
            500: '#8100e6',
            600: '#6400b4',
            700: '#470082',
            800: '#2b0050',
            900: '#100200'
        }
    },
    config: {
        initialColorMode: 'dark',
        useSystemColorMode: true
    }
};
