import * as React from 'react';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    ChakraProvider,
    Divider,
    Heading,
    Switch,
    Image,
    Text,
    Flex,
    Box,
    Link,
    RangeSlider,
    RangeSliderFilledTrack,
    RangeSliderThumb,
    RangeSliderTrack,
    Icon
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import './styles/popup.css';
import { browser } from 'webextension-polyfill-ts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { FaPaypal } from 'react-icons/fa';
import { Activity } from '../contentScripts/trade/Trade';
import theme from './theme';
import { defaultSettings, Settings } from '../background/settings';
import manifest from '../../manifest.json';

dayjs.extend(relativeTime);

const Popup = () => {
    const [activity, setActivity] = useState([] as Activity[]);
    const [time, setTime] = useState(Date.now() + 10_000);
    const [settings, setSettings] = useState(defaultSettings);

    useEffect(() => {
        function handler(changes: Record<string, Storage['StorageChange']>) {
            // eslint-disable-next-line no-restricted-syntax
            for (const key of Object.keys(changes)) {
                switch (key) {
                    case 'activity':
                        setActivity(changes.activity.newValue);
                        break;
                }
            }
        }

        browser.storage.onChanged.addListener(handler);

        // Init Activity + Settings
        browser.storage.sync.get(['activity', 'settings']).then(data => {
            setActivity(data.activity || []);
            if (settings) setSettings(data.settings);
        });

        // Update Time Every 3 Seconds
        const timeInterval = setInterval(() => {
            setTime(Date.now() + 10_000);
        }, 3_000);

        return () => {
            browser.storage.onChanged.removeListener(handler);
            clearInterval(timeInterval);
        };
    }, []);

    function toggleEnabled() {
        const newSettings: Settings = {
            ...settings,
            enabled: !settings.enabled
        };
        browser.storage.sync.set({
            settings: newSettings
        });
        setSettings(newSettings);
    }

    function updateBumpRange([min, max]: [number, number]) {
        const newSettings: Settings = {
            ...settings,
            min,
            max
        };
        browser.storage.sync.set({
            settings: newSettings
        });
        setSettings(newSettings);
    }

    return (
        <ChakraProvider theme={theme}>
            <Box p='4'>
                <Flex align='center'>
                    <Image src='assets/icon-128x128.png' alt='Icon' h='64px' marginRight='8' />
                    <Heading size='lg'>
                        Rocket League Garage
                        <br />
                        Trade Bumper
                    </Heading>
                </Flex>
                <Divider my='4' />
                <Flex align='center' direction='column' justify='center'>
                    <Heading size='sm'>{settings.enabled ? 'Enabled' : 'Disabled'}</Heading>
                    <Switch id='enabled' size='lg' my='4' colorScheme='brand' isChecked={settings.enabled} onChange={toggleEnabled} />
                    <Text textAlign='center'>
                        To automatically bump trades, go to the "My Trades" page on Rocket League Garage and leave the tab open.
                    </Text>
                    <RangeSlider
                        aria-label={['min', 'max']}
                        defaultValue={[15, 16]}
                        step={1}
                        min={15}
                        max={60}
                        colorScheme='brand'
                        value={[settings.min, settings.max]}
                        onChange={updateBumpRange}
                        mt={4}
                    >
                        <RangeSliderTrack>
                            <RangeSliderFilledTrack />
                        </RangeSliderTrack>
                        <RangeSliderThumb index={0} />
                        <RangeSliderThumb index={1} />
                    </RangeSlider>
                    <Text textAlign='center'>
                        Bumping trades every {settings.min !== settings.max ? `${settings.min} to ${settings.max}` : settings.min} minute
                        {settings.max !== 1 ? 's' : ''}.
                    </Text>
                </Flex>
                <Divider my='4' />
                <Heading size='sm' mb='4'>
                    Recent Activity
                </Heading>
                {activity.length > 0 ? (
                    <div className='activity-container'>
                        {activity.slice(0, 50).map(entry => (
                            <Text key={entry.timestamp}>
                                <AddIcon marginRight='4' color='purple' />
                                Bumped a trade with id <Text as='strong'>{entry.id.split('-')[0]}</Text> {dayjs(entry.timestamp).from(time)}
                                .
                            </Text>
                        ))}
                        {activity.length > 50 && (
                            <Text as='i'>
                                <AddIcon marginRight='4' color='purple' />
                                {activity.length - 50} more
                            </Text>
                        )}
                    </div>
                ) : (
                    <Text>No recent activity yet.</Text>
                )}
                <Divider my='4' />
                <Text>
                    <Text display='inline-block'>Version {manifest.version}</Text>
                    <Link
                        float='right'
                        href='https://www.paypal.com/donate/?hosted_button_id=A3D7XYBB3WM9J'
                        isExternal
                        textDecor='underline'
                        display='inline-block'
                    >
                        Donate
                        <Icon as={FaPaypal} ml={2} />
                    </Link>
                    <br />
                    Developed by <Text as='strong'>AngaBlue</Text>.{' '}
                    <Link href='https://anga.blue/contact' isExternal textDecor='underline'>
                        Contact me
                    </Link>{' '}
                    for support.
                </Text>
            </Box>
        </ChakraProvider>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<Popup />);
