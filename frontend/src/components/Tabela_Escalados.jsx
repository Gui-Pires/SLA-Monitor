import { useEffect, useState } from "react"
import Progressbar from './Progressbar'

function Tabela({ titulo, dados, extraClass = "" }) {
    const [now, setNow] = useState(new Date())
    const MAPA_SLA = {
        15: "15 minutos",
        30: "30 minutos",
        120: "2 horas",   // Geralmente o código para Severidade 3
        240: "4 horas",   // Severidade 4
        480: "8 horas",   // Severidade 5
        1920: "24 horas", // Severidade 6
        // Adicione outros códigos conforme aparecerem no seu console.log
    }

    const URL_OC = 'https://addit.crm2.dynamics.com/main.aspx?appid=c3bc7977-3c63-eb11-b0b0-000d3ac07dce&pagetype=entityrecord&etn=incident&id='
    const URL_CL = 'https://addit.crm2.dynamics.com/main.aspx?appid=63ecc50a-d85c-ec11-8f8f-000d3a889f3c&pagetype=entityrecord&etn=account&id='
    const URL_US = 'msteams:/l/chat/0/0?users='

    // atualiza "now" a cada 1 segundo
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date())
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    if (!dados || dados.length === 0 || dados == null) {
        return (
            <div className={"row my-3 border rounded rounded-4 " + extraClass}>
                <div className="col p-0">
                    <h4 className="text-start my-2 mx-3">{titulo}</h4>
                </div>
            </div>
        )
    }

    // function calcularProgressoNaoAgendado(inicio, prioritycode) {
    //     const inicioDate = new Date(inicio)
    //     let inicioDateCalc = new Date(inicio)
    //     const sla_type = prioritycode <= 30 ? 'm' : 'h'
    //     const sla_value = sla_type === 'm'
    //         ? inicioDateCalc.setMinutes(inicioDateCalc.getMinutes() +  MAPA_SLA_VALUES[prioritycode]) 
    //         : inicioDateCalc.setHours(inicioDateCalc.getHours() +  MAPA_SLA_VALUES[prioritycode])
        
    //     const total = inicioDateCalc - inicioDate
    //     const res_sla = sla_value - now

    //     if (res_sla <= 0) return 0 // SLA estourada

    //     return Math.max(0, (res_sla / total) * 100)
    // }

    // function getDataFuturaNaoAgendado(inicio, prioritycode) {
    //     let inicioDateCalc = new Date(inicio)
    //     const sla_type = prioritycode <= 30 ? 'm' : 'h'
    //     const sla_value = sla_type === 'm'
    //         ? inicioDateCalc.setMinutes(inicioDateCalc.getMinutes() +  MAPA_SLA_VALUES[prioritycode]) 
    //         : inicioDateCalc.setHours(inicioDateCalc.getHours() +  MAPA_SLA_VALUES[prioritycode])
        
    //     return sla_value
    // }

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

    function calcularProgresso(inicio, fim) {
        const inicioDate = new Date(inicio)
        const fimDate = new Date(fim)
        const total = fimDate - inicioDate
        const restante = fimDate - now

        if (restante <= 0) return 0 // SLA estourada

        return Math.max(0, (restante / total) * 100)
    }

    return (
        <div className={"session-table row my-3 border rounded rounded-4 overflow-hidden " + extraClass}>
            <div className="col table-responsive p-0">
                <div className="d-flex justify-content-between">
                    <h4 className="my-2 mx-3">{titulo}</h4>
                    <small className="border border-primary bg-blur rounded py-1 px-2 my-2 mx-3 small-text">{dados.length}</small>
                </div>
                <table className={"table table-hover align-middle border-none m-0"}>
                    <thead>
                        <tr className="row-cols-5">
                            <th>Ocorrência</th>
                            <th>Consultor/Equipe</th>
                            <th>Cliente</th>
                            <th>SLA</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dados.map((item, i) => (
                            <tr key={item.ticketnumber} className={calcularProgresso(item.modifiedon || item.createdon, item.failuretime) === 0 ? 'sla-over' : ''}>
                                <td>
                                    <a className="text-decoration-none" href={URL_OC + item.incidentid} target="_blank" rel="noopener noreffer">{item.ticketnumber}</a>
                                    <button type="button" className="btn float-end p-0 border-none" data-bs-toggle="modal" data-bs-target={`#${item.ticketnumber}-modal`}>
                                        <i className="bi bi-info-circle-fill"></i>
                                    </button>
                                </td>
                                <td>
                                    {item.owningteam ? item.owningteam.name 
                                        : item.owninguser ? <a className="text-decoration-none" href={URL_US + item.owninguser.domainname  + '&message= Essa ' + item.ticketnumber + ' está na sua fila...'} target="_blank" rel="noopener noreffer">{item.owninguser.fullname}</a>
                                        : item._owninguser_value}
                                </td>
                                <td>
                                    <a className="text-decoration-none" href={URL_CL + item._customerid_value} target="_blank" rel="noopener noreferrer">
                                        {item.customerid_account ? item.customerid_account.name : item._customerid_value}
                                    </a>
                                </td>
                                <td>{MAPA_SLA[item.regarding_new_atribuicaoeescalacao.new_prioritycodesla]}</td>
                                <td>
                                    {calcularProgresso(item.modifiedon || item.createdon, item.failuretime) === 0 ? 'Estourou SLA' :
                                        <Progressbar progress={calcularProgresso(item.modifiedon || item.createdon, item.failuretime)} />
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {dados.map((item, i) => (
                    <div key={i} className="modal fade" id={`${item.ticketnumber}-modal`} tabIndex="-1" aria-labelledby="modal" aria-hidden="true">
                        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h1 className="modal-title fs-5">{item.ticketnumber} | {item.title}</h1>
                                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div className="modal-body text-start">
                                    <h6 className="text-primary-emphasis text-end">Tempo restante: {timer(item.failuretime)}</h6>
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
                ))}
            </div>
        </div>
    )
}

export default Tabela