import * as React from "react";
import { useEffect, useState } from "react";
import * as ReactDOM from "react-dom";
import {
  Divider,
  Heading,
  Switch,
  Image,
  Text,
  Flex,
  Icon,
} from "@chakra-ui/core";
import "./styles/popup.css";
import { ThemeProvider } from "emotion-theming";
import theme from "./theme";
import { browser } from "webextension-polyfill-ts";
import { Activity } from "../contentScripts/trade/trade";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { defualtSettings, Settings } from "../background/settings";
import manifest from "../../manifest.json";

dayjs.extend(relativeTime);

const Popup = () => {
  const [activity, setActivity] = useState([] as Activity[]);
  const [time, setTime] = useState(Date.now());
  const [settings, setSettings] = useState(defualtSettings);
  useEffect(() => {
    function handler(
      changes: Record<string, Storage["StorageChange"]>,
      _areaName: string
    ) {
      for (const key of Object.keys(changes)) {
        switch (key) {
          case "activity":
            setActivity(changes.activity.newValue);
            break;
        }
      }
    }
    browser.storage.onChanged.addListener(handler);
    // Init Activity + Settings
    browser.storage.sync.get(["activity", "settings"]).then((data) => {
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
      enabled: !settings.enabled,
    };
    browser.storage.sync.set({
      settings: newSettings,
    });
    setSettings(newSettings);
  }
  return (
    <ThemeProvider theme={theme}>
      <Flex align="center">
        <Image
          src="assets/icon-128x128.png"
          alt="Icon"
          size="64px"
          marginRight="16px"
        />
        <Heading size="md">Rocket League Garage Trade Bumper</Heading>
      </Flex>
      <Divider />
      <Flex align="center" direction="column" justify="center">
        <Heading size="sm">{settings.enabled ? "Enabled" : "Disabled"}</Heading>
        <Switch
          id="enabled"
          size="lg"
          color="purple"
          isChecked={settings.enabled}
          onChange={toggleEnabled}
        />
        <Text textAlign="center">
          To automatically bump trades, go to the "My Trades" page on Rocket
          League Garage and leave the tab open.
        </Text>
      </Flex>
      <Divider />
      <Heading size="sm">Recent Activity</Heading>
      {activity.length > 0 ? (
        <div className="activity-container">
          {activity.slice(0, 20).map((entry) => (
            <Text key={entry.timestamp}>
              <Icon name="small-add" marginRight="4px" color="purple" />
              Bumped a trade with id <Text as="strong">{entry.id.split("-")[0]}</Text>{" "}
              {dayjs(entry.timestamp).from(time)}.
            </Text>
          ))}
          {activity.length > 20 && (
            <Text as="i">
              <Icon name="small-add" marginRight="4px" color="purple" />
              {activity.length - 20} more
            </Text>
          )}
        </div>
      ) : (
        <Text>No recent activity yet.</Text>
      )}
      <Divider />
      <Text>
        Version {manifest.version}
        <br />
        Developed by <Text as="strong">AngaBlue</Text>.{" "}
        <a
          href="https://anga.blue/contact"
          target="_blank"
          rel="noopener noreferer"
        >
          Contact me
        </a>{" "}
        for support.
      </Text>
    </ThemeProvider>
  );
};

ReactDOM.render(<Popup />, document.getElementById("root"));
