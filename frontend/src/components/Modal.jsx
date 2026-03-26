import { useState } from "react"

export default function ModalOC({ item, index, type }) {
    const [now, setNow] = useState(new Date())

    const MAP_VALUE_TIMER = {
        'na': getFailureSLA(item.nextsla),
        'at': getFailureSLA(item.nextsla),
        'es': item.failuretime,
        'ag': item.add_datadoagendamento
    }

    const futureDate = MAP_VALUE_TIMER[type]

    function timer(fimDate) {
        const fim = new Date(fimDate)
        let restante = fim - now

        if (restante <= 0) return "Estourado" // SLA estourada

        const resDate = new Date(restante)

        const [days, hours, minutes, seconds] = [resDate.getUTCDate() - 1, resDate.getUTCHours(), resDate.getUTCMinutes(), resDate.getUTCSeconds()]

        let formatTime = ``
        if (days > 0) {
            formatTime += `${days}d`
        }
        if (hours > 0) {
            formatTime += ` ${hours}h`
        }
        if (minutes > 0) {
            formatTime += ` ${minutes}m`
        }
        if (days <= 0 && hours <= 0) {
            formatTime += ` ${seconds}s`
        }

        return formatTime
    }

    function getFailureSLA(item_data) {
        try {
            if (!item_data) {
                return false
            }

            const res_item_data = JSON.parse(item_data)

            if (!res_item_data.FailureTime) {
                return false
            }

            const resDataFail = new Date(res_item_data.FailureTime)
            return resDataFail
        } catch (err) {
            return false
        }
    }

    return (
        <div key={index} className="modal fade" id={`${type}-modal-${index}`} tabIndex="-1" aria-labelledby="modal" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <div className="d-flex flex-column text-start">
                            <h1 className="modal-title fs-5">{item.ticketnumber} | {item.title}</h1>
                            <small className="text-small text-body-secondary">{item.responsiblecontactid?.fullname}, {item.customerid_account?.name}</small>
                        </div>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body text-start">
                        <h6 className="text-primary-emphasis text-end">Tempo restante: {timer(futureDate)}</h6>
                        {String(item.description).split(/\n/gi).map((item, i) => (
                            <p key={i}>{item}</p>
                        ))}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    )
}