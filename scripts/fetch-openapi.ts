import { existsSync, writeFile } from "node:fs";
import config from "../generator.config.ts";

const download = async () => {
    if (existsSync(config.output_file)) {
        console.info(`${config.output_file} already exists, exiting.`);
        return;
    }
    console.info(`Downloading spec at ${config.spec_url}...`);
    const response = await fetch(config.spec_url);
    if (!response.ok) {
        console.warn(`Response returned ${response.status} (message: ${response.statusText})`);
        return;
    }
    const json = await response.text();
    writeFile(config.output_file, json, (err) => {
        if (err) {
            console.error(err)
        }
    });
    console.info(`Downloaded spec file to ${config.output_file}`);
}

download();
