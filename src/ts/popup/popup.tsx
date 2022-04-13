import * as React from 'react';
import { useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
import { ChakraProvider, Divider, Heading, Switch, Image, Text, Flex, Box, Link } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import './styles/popup.css';
import { browser } from 'webextension-polyfill-ts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Activity } from '../contentScripts/trade/trade';
import theme from './theme';
import { defualtSettings, Settings } from '../background/settings';
import manifest from '../../manifest.json';

dayjs.extend(relativeTime);

const Popup = () => {
    const [activity, setActivity] = useState([] as Activity[]);
    const [time, setTime] = useState(Date.now());
    const [settings, setSettings] = useState(defualtSettings);
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

        // Update Time Every 5 Seconds
        const timeInterval = setInterval(() => {
            setTime(Date.now());
        }, 3000);
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
                    Version {manifest.version}
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

ReactDOM.render(<Popup />, document.getElementById('root'));
