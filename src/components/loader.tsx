"use client";

export function Loader({ width = 24, height = 24 }) {
    return (
        <div className="flex-center w-full">
            <img
                src="/icons/loader.svg"
                alt="loader"
                width={width}
                height={height}
                className="animate-spin"
            />
        </div>
    );
}