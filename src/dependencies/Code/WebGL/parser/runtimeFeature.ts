export type RuntimeFeatureContext = {
    source: string;
    backupScope: string;
    shaderFilterRules: string;
};

export type RuntimeFeature = {
    imports: string[];
    setup: (context: RuntimeFeatureContext) => string[];
};

export type RuntimeFeatureRegistration = {
    id: string;
    detectUse: (context: RuntimeFeatureContext) => boolean | "Toggled";
    load: () => Promise<RuntimeFeature>;
};
