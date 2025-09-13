import '@testing-library/jest-dom/matchers';

declare module 'vitest' {
    interface Assertion<T = any> extends CustomMatchers<T> {}
    interface AsymmetricMatchersContaining extends CustomMatchers {}
}

interface CustomMatchers<R = unknown> {
    toBeInTheDocument(): R;
    toHaveTextContent(text: string | RegExp): R;
    toBeVisible(): R;
    toBeEmptyDOMElement(): R;
    toBeDisabled(): R;
    toBeEnabled(): R;
    toHaveClass(className: string): R;
    toHaveAttribute(attr: string, value?: string): R;
    toHaveStyle(style: string | Record<string, any>): R;
    toHaveFocus(): R;
    toBeChecked(): R;
    toBePartiallyChecked(): R;
    toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R;
    toHaveFormValues(values: Record<string, any>): R;
    toHaveValue(value: string | string[] | number): R;
    toBeInvalid(): R;
    toBeValid(): R;
    toBeRequired(): R;
}