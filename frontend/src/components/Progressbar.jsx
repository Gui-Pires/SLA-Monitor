// import { useState, useEffect } from "react"

export default function SLAProgress({ progress, timer }) {
    function bgColor(valor) {
        if (valor <= 30) {
            return "bg-danger"
        } else if (valor <= 70) {
            return "bg-warning"
        }

        return "bg-success"
    }

    return (
        <div className="progress position-relative" role="progressbar"
            aria-label={"Progressbar"} aria-valuenow={25} aria-valuemin={0}
            aria-valuemax={100} style={{ height: "20px" }}>
            <div className={"progress-bar " + bgColor(progress)}
            style={{ width: `${progress}%` }}>
                <span className="position-absolute top-50 start-50 translate-middle fw-bold fs-6 text-progress">{progress > 1 ? progress.toFixed(0) : progress.toFixed(2)}%</span>
            </div>
            {progress <= 10 
            ? <span className="position-absolute top-50 end-0 translate-middle text-danger animation-danger"><i className="bi bi-exclamation-triangle-fill"></i></span>
            : ''
            }
        </div>
    )
}