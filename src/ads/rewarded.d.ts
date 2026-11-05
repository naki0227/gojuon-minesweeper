// Platform-specific implementation: native AdMob / nothing on the web.
// True only once the person has watched the ad to the reward.
export declare function requestRewardedAd(): Promise<boolean>;
// Whether this platform can show a rewarded ad at all.
export declare const REWARDED_SUPPORTED: boolean;
