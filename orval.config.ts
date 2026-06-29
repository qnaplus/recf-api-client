import { defineConfig } from 'orval';
import config from "./generator.config.ts";

export default defineConfig({
    recf: {
        input: config.output_file,
        output: {
            mode: "tags-split",
            target: "src",
            client: "fetch",
            namingConvention: "kebab-case",
            formatter: "oxfmt",
            tagsSplitDeduplication: true
        }
    },
});
