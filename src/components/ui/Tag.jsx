import Tag from 'antd/es/tag';

const CustomTag = ({ children, color, bgColor, variant, closable, onClose, onClick }) => {

    const variantClasses = {
        primary: "themePrimary",
        secondary: "themeSecondary",
        accent: "themeAccent",
        action: "themeAction",
    };

    return (
        <Tag
            color={variant === "action" ? undefined : color}
            closable={closable}
            onClose={onClose}
            onClick={onClick}
            className={`rounded-full w-fit max-h-fit px-3 py-0 text-xs flex items-center justify-center ${variantClasses[variant] || ''}`}
        >
            {children}
        </Tag>
    );
};

export default CustomTag;