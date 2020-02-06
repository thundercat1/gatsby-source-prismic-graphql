import React from 'react';
export default class PreviewPage extends React.Component<any> {
    componentDidMount(): void;
    get config(): any;
    preview(): Promise<void>;
    redirect: (doc?: any) => Promise<void>;
    render(): null;
}
