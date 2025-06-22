import { useEffect, useCallback, useRef } from 'react';
import { useJoyConContext } from '../contexts/JoyConContext';

export const useJoyConNavigation = ({
    onUp,
    onDown,
    onLeft,
    onRight,
    onSelect,
    onBack,
    onHome,
    onMenu,
    onYButton,
    onXButton,
    sensitivity = 0.7,
    deadzone = 0.3,
    enabled = true
}) => {
    const { inputState, isConnected, registerInputCallback } = useJoyConContext();
    const lastInputRef = useRef({});
    const stickTimeoutRef = useRef(null);
    const lastStickInputRef = useRef({ x: 0, y: 0 });

    // Handle analog stick navigation
    const handleStickNavigation = useCallback(() => {
        if (!enabled || !isConnected) return;

        const { leftStick } = inputState;

        const deltaX = Math.abs(leftStick.x - lastStickInputRef.current.x);
        const deltaY = Math.abs(leftStick.y - lastStickInputRef.current.y);

        if (deltaX < 0.1 && deltaY < 0.1) return;

        lastStickInputRef.current = { x: leftStick.x, y: leftStick.y };

        if (stickTimeoutRef.current) {
            clearTimeout(stickTimeoutRef.current);
        }

        if (Math.abs(leftStick.x) > deadzone || Math.abs(leftStick.y) > deadzone) {
            if (Math.abs(leftStick.x) > Math.abs(leftStick.y)) {
                if (leftStick.x > sensitivity) {
                    console.log('Stick navigation: right');
                    onRight?.();
                } else if (leftStick.x < -sensitivity) {
                    console.log('Stick navigation: left');
                    onLeft?.();
                }
            } else {
                if (leftStick.y > sensitivity) {
                    console.log('Stick navigation: up');
                    onUp?.();
                } else if (leftStick.y < -sensitivity) {
                    console.log('Stick navigation: down');
                    onDown?.();
                }
            }

            stickTimeoutRef.current = setTimeout(() => {
                stickTimeoutRef.current = null;
            }, 200);
        }
    }, [inputState.leftStick, onUp, onDown, onLeft, onRight, sensitivity, deadzone, enabled, isConnected]);

    // Input callback for real-time button processing
    const handleInput = useCallback((newInputState) => {
        if (!enabled) return;

        Object.keys(newInputState.buttons).forEach(button => {
            const currentPressed = newInputState.buttons[button];
            const wasPressed = lastInputRef.current[button];

            if (currentPressed && !wasPressed) {
                console.log(`Input callback - Button pressed: ${button}`);
                switch (button) {
                    case 'up':
                        onUp?.();
                        break;
                    case 'down':
                        onDown?.();
                        break;
                    case 'left':
                        onLeft?.();
                        break;
                    case 'right':
                        onRight?.();
                        break;
                    case 'a':
                        onSelect?.();
                        break;
                    case 'b':
                        onBack?.();
                        break;
                    case 'x':
                        onXButton?.();
                        break;
                    case 'y':
                        onYButton?.();
                        break;
                    case 'home':
                        onHome?.();
                        break;
                    case 'plus':
                    case 'minus':
                        onMenu?.();
                        break;
                }
            }

            lastInputRef.current[button] = currentPressed;
        });

    }, [enabled, onUp, onDown, onLeft, onRight, onSelect, onBack, onHome, onMenu, onYButton, onXButton]);

    // Register input callback
    useEffect(() => {
        if (!enabled || !isConnected) return;

        console.log('Registering Joy-Con input callback');
        const cleanup = registerInputCallback(handleInput);
        return cleanup;
    }, [enabled, isConnected, registerInputCallback, handleInput]);

    // Handle analog stick
    useEffect(() => {
        if (!enabled || !isConnected) return;

        if (!stickTimeoutRef.current) {
            handleStickNavigation();
        }
    }, [inputState.leftStick, enabled, isConnected, handleStickNavigation]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (stickTimeoutRef.current) {
                clearTimeout(stickTimeoutRef.current);
            }
        };
    }, []);

    return {
        isConnected,
        inputState,
        setEnabled: (enabled) => enabled
    };
};
