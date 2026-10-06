// Native only (mobileAdsModule.native.ts). Web never imports the ads SDK.
export type MobileAdsModule = typeof import("react-native-google-mobile-ads");

export declare const mobileAds: MobileAdsModule | null;
