import { PluginOptions } from './interfaces/PluginOptions';
interface WrapPageArgs {
    element: any;
    props: any;
}
export declare const wrapPageElement: ({ element, props }: WrapPageArgs, options: PluginOptions) => any;
export {};
