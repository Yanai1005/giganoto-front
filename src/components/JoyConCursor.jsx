// src/components/JoyConCursor.jsx - Fixed version with null safety
import { useEffect, useCallback, useRef, useState } from 'react';
import { useJoyConContext } from '../contexts/JoyConContext';

const SimpleJoyConCursor = ({
    enabled = true,
    sensitivity = 0.3,
    deadzone = 0.2,
    showCursor = true
}) => {
    const { inputState, isConnected } = useJoyConContext();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isClicking, setIsClicking] = useState(false);
    const animationFrameRef = useRef(null);
    const lastButtonStateRef = useRef({});
    const velocityRef = useRef({ x: 0, y: 0 });
    const cursorRef = useRef(null);
    const [calibrationOffset, setCalibrationOffset] = useState({ x: 0, y: 0 });

    // Safe getter for left stick with null checks
    const getLeftStick = useCallback(() => {
        if (!inputState || !inputState.leftStick) {
            return { x: 0, y: 0 };
        }

        const stick = inputState.leftStick;
        return {
            x: parseFloat(stick.x) || 0,
            y: parseFloat(stick.y) || 0
        };
    }, [inputState]);

    // Safe getter for buttons with null checks
    const getButtons = useCallback(() => {
        if (!inputState || !inputState.buttons) {
            return {};
        }
        return inputState.buttons;
    }, [inputState]);

    // Initialize mouse position to center of screen
    useEffect(() => {
        setMousePosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        });
    }, []);

    // Calibration effect
    useEffect(() => {
        if (enabled && isConnected) {
            const timer = setTimeout(() => {
                const stick = getLeftStick();
                setCalibrationOffset({
                    x: stick.x,
                    y: stick.y
                });
                console.log('Joy-Con cursor calibrated to:', stick);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [enabled, isConnected, getLeftStick]);

    // Create and manage custom cursor
    useEffect(() => {
        if (!showCursor) return;

        const cursor = document.createElement('div');
        cursor.style.cssText = `
            position: fixed;
            width: 16px;
            height: 16px;
            background: rgba(255, 0, 0, 0.8);
            border: 2px solid white;
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            transform: translate(-50%, -50%);
            transition: opacity 0.2s ease, transform 0.1s ease;
        `;
        cursor.id = 'joy-con-cursor';
        document.body.appendChild(cursor);
        cursorRef.current = cursor;

        return () => {
            if (cursorRef.current && document.body.contains(cursorRef.current)) {
                document.body.removeChild(cursorRef.current);
                cursorRef.current = null;
            }
        };
    }, [showCursor]);

    // Update cursor position
    useEffect(() => {
        if (cursorRef.current) {
            cursorRef.current.style.left = `${mousePosition.x}px`;
            cursorRef.current.style.top = `${mousePosition.y}px`;
            cursorRef.current.style.opacity = enabled && isConnected ? '1' : '0.3';
        }
    }, [mousePosition, enabled, isConnected]);

    // Fire mouse events
    const fireMouseEvent = useCallback((type, x, y, button = 0) => {
        const element = document.elementFromPoint(x, y);
        if (!element) return null;

        const event = new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: x,
            clientY: y,
            screenX: x + window.screenX,
            screenY: y + window.screenY,
            button: button,
            buttons: button === 0 ? 1 : 0
        });

        element.dispatchEvent(event);
        return element;
    }, []);

    // Normalize stick input with null safety
    const normalizeStickInput = useCallback((stick) => {
        if (!stick) return { x: 0, y: 0 };

        // Apply calibration offset
        let adjustedX = stick.x - calibrationOffset.x;
        let adjustedY = stick.y - calibrationOffset.y;

        // Apply deadzone
        if (Math.abs(adjustedX) < deadzone) adjustedX = 0;
        if (Math.abs(adjustedY) < deadzone) adjustedY = 0;

        // Normalize to -1 to 1 range (adjust these ranges based on your Joy-Con)
        const normalizedX = Math.max(-1, Math.min(1, adjustedX / 1.2));
        const normalizedY = Math.max(-1, Math.min(1, adjustedY / 1.0));

        return { x: normalizedX, y: normalizedY };
    }, [calibrationOffset, deadzone]);

    // Update mouse position based on stick input
    const updateMousePosition = useCallback(() => {
        if (!enabled || !isConnected) return;

        const stick = getLeftStick();
        const normalizedStick = normalizeStickInput(stick);
        const magnitude = Math.sqrt(normalizedStick.x ** 2 + normalizedStick.y ** 2);

        if (magnitude > 0.1) {
            // Calculate velocity
            const targetVelocityX = normalizedStick.x * sensitivity * 25;
            const targetVelocityY = normalizedStick.y * sensitivity * 25;

            // Smooth velocity transition
            velocityRef.current.x = velocityRef.current.x * 0.7 + targetVelocityX * 0.3;
            velocityRef.current.y = velocityRef.current.y * 0.7 + targetVelocityY * 0.3;

            // Apply velocity to position
            setMousePosition(prev => {
                const newX = Math.max(0, Math.min(window.innerWidth - 1,
                    prev.x + velocityRef.current.x));
                const newY = Math.max(0, Math.min(window.innerHeight - 1,
                    prev.y + velocityRef.current.y));

                // Fire mouse move event if position changed significantly
                if (Math.abs(newX - prev.x) > 1 || Math.abs(newY - prev.y) > 1) {
                    fireMouseEvent('mousemove', newX, newY);
                }

                return { x: newX, y: newY };
            });
        } else {
            // Reduce velocity when stick is centered
            velocityRef.current.x *= 0.3;
            velocityRef.current.y *= 0.3;
        }

        animationFrameRef.current = requestAnimationFrame(updateMousePosition);
    }, [enabled, isConnected, getLeftStick, normalizeStickInput, sensitivity, fireMouseEvent]);

    // Handle button presses
    useEffect(() => {
        if (!enabled || !isConnected) return;

        const buttons = getButtons();
        const currentPosition = mousePosition;

        // A button: Left click
        const aPressed = buttons.a || false;
        const aWasPressed = lastButtonStateRef.current.a || false;

        if (aPressed && !aWasPressed) {
            setIsClicking(true);
            if (cursorRef.current) {
                cursorRef.current.style.transform = 'translate(-50%, -50%) scale(1.2)';
                cursorRef.current.style.background = 'rgba(0, 0, 255, 0.9)';
            }
            fireMouseEvent('mousedown', currentPosition.x, currentPosition.y, 0);
        } else if (!aPressed && aWasPressed) {
            setIsClicking(false);
            if (cursorRef.current) {
                cursorRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
                cursorRef.current.style.background = 'rgba(255, 0, 0, 0.8)';
            }
            const element = fireMouseEvent('mouseup', currentPosition.x, currentPosition.y, 0);
            fireMouseEvent('click', currentPosition.x, currentPosition.y, 0);

            // Focus element if it's focusable
            if (element && (element.tabIndex >= 0 ||
                ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'].includes(element.tagName))) {
                element.focus();
            }
        }

        // B button: Right click
        const bPressed = buttons.b || false;
        const bWasPressed = lastButtonStateRef.current.b || false;

        if (bPressed && !bWasPressed) {
            fireMouseEvent('contextmenu', currentPosition.x, currentPosition.y, 2);
        }

        // X button: Double click
        const xPressed = buttons.x || false;
        const xWasPressed = lastButtonStateRef.current.x || false;

        if (xPressed && !xWasPressed) {
            fireMouseEvent('dblclick', currentPosition.x, currentPosition.y, 0);
        }

        // Store button states
        lastButtonStateRef.current = {
            a: aPressed,
            b: bPressed,
            x: xPressed
        };

    }, [enabled, isConnected, getButtons, mousePosition, fireMouseEvent]);

    // Animation loop
    useEffect(() => {
        if (enabled && isConnected) {
            animationFrameRef.current = requestAnimationFrame(updateMousePosition);
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [enabled, isConnected, updateMousePosition]);

    // Manual calibration function
    const recalibrate = useCallback(() => {
        if (isConnected) {
            const stick = getLeftStick();
            setCalibrationOffset({
                x: stick.x,
                y: stick.y
            });
            velocityRef.current = { x: 0, y: 0 };
            console.log('Joy-Con cursor recalibrated to:', stick);
        }
    }, [isConnected, getLeftStick]);

    // Return null since this is a non-visual component
    return null;
};

export default SimpleJoyConCursor;
