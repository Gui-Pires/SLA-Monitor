import { useEffect, useState, useMemo } from "react"
import Tabela_NaoAtribuidos from "./components/Tabela_NaoAtribuidos"
import Tabela_Atribuidos from "./components/Tabela_Atribuidos"
import Tabela_Escalados from "./components/Tabela_Escalados"
import Tabela_Agendados from "./components/Tabela_Agendados"
import axios from "axios"
import "./App.css"

function App() {
    const [naoAtribuidos, setNaoAtribuidos] = useState(null)
    const [atribuidos, setAtribuidos] = useState(null)
    const [escalados, setEscalados] = useState(null)
    const [agendados, setAgendados] = useState(null)

    const [bgColorPrefer, setBgColorPrefer] = useState('#162a9c')

    const [filterUser, setFilterUser] = useState('')
    const [filterTeam, setFilterTeam] = useState('')

    const [token, setToken] = useState(null)

    // Now
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date())
        }, 1000)

        const color = localStorage.getItem('colorPreferSLA')
        if (color) setColorPrefer(color)

        return () => clearInterval(interval)
    }, [])

    function formatDate(dateStr) {
        // cria objeto Date a partir da string ISO
        const date = new Date(dateStr)

        // pega dia, mês, ano, hora e minuto
        const day = String(date.getDate()).padStart(2, "0")
        const month = String(date.getMonth() + 1).padStart(2, "0") // meses 0-11
        const year = date.getFullYear()

        const hours = String(date.getHours()).padStart(2, "0")
        const minutes = String(date.getMinutes()).padStart(2, "0")
        const seconds = String(date.getSeconds()).padStart(2, "0")

        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
    }

    function atualizarCamposPorId(base, atualizacoes) {
        if (!Array.isArray(base) || !Array.isArray(atualizacoes)) {
            throw new Error("As entradas devem ser arrays de objetos.")
        }

        // Cria um mapa para busca rápida por ID
        const mapaAtualizacoes = new Map(
            atualizacoes.map(item => [item.regarding_new_atribuicaoeescalacao._new_ocorrencia_value, {regarding_new_atribuicaoeescalacao: item.regarding_new_atribuicaoeescalacao, failuretime: item.failuretime}])
        )

        const atualizados = base
            .filter(item => item.customerid_account.name !== 'ADD IT Cloud Solutions' && mapaAtualizacoes.has(item.incidentid))
            .map(item => {
                const updateData = mapaAtualizacoes.get(item.incidentid)
                return { ...item, ...updateData }
            })

        return atualizados
    }

    // const getToken = async () => {
    //     try {
    //         // Agora chama o seu Node, que não tem restrição de CORS para o Microsoft Login
    //         const response = await axios.get('http://noteadd1150:3001/api/token')

    //         const novoToken = response.data.access_token
    //         setToken(novoToken)
    //         return novoToken
    //     } catch (error) {
    //         console.error("Erro ao resgatar token via Proxy:", error)
    //     }
    // }

    const getData = async () => {
        // if (!token) return // Não faz nada se o token ainda não existir
        // const headers = {
        //     'Authorization': `Bearer ${token}`,
        //     'Accept': 'application/json'
        // }

        try {
            // Chamada única para o seu novo endpoint protegido
            const response = await axios.get('http://noteadd1150:3001/api/sla-data')
            const { atendimentoGeral, agendados, todosAtivos, slaKpis } = response.data

            // Não atribuídas + atribuídas
            const fillBase_naoAtribuidas = atendimentoGeral.filter((item) => item._owninguser_value === null && item.customerid_account.name !== 'ADD IT Cloud Solutions')
            const fillBase_atribuidas = atendimentoGeral.filter((item) => item._owninguser_value !== null && item.customerid_account.name !== 'ADD IT Cloud Solutions')

            // Escalados
            const fillBase_escalados = atualizarCamposPorId(todosAtivos, slaKpis)

            // Agendados
            const fillBase_agendados = agendados.filter((item) => item.customerid_account.name !== 'ADD IT Cloud Solutions' 
                && new Date(item.add_datadoagendamento) > new Date(item.modifiedon))

            // Setters das variáveis
            setNaoAtribuidos(fillBase_naoAtribuidas)
            setAtribuidos(fillBase_atribuidas)
            setEscalados(fillBase_escalados)
            setAgendados(fillBase_agendados)
        } catch (error) {
            console.error("Erro ao buscar dados:", error)
        }
    }

    // useEffect(() => {
    //     getToken()
    //     const interval = setInterval(() => {
    //         getToken()
    //     }, 2500000)

    //     return () => clearInterval(interval)
    // }, [])

    useEffect(() => {
        getData()

        const interval = setInterval(() => {
            getData()
        }, 5000)

        return () => clearInterval(interval)
    }, [token])

    function toggleTheme() {
        const bodyElem = document.getElementsByTagName('body')[0]
        let theme = bodyElem.attributes['data-bs-theme'].value
        theme = theme === 'dark' ? 'light' : 'dark'
        bodyElem.attributes['data-bs-theme'].value = theme

        const btnTheme = document.getElementById('btn-theme')
        let classBtnTheme = theme === 'dark' ? 'bi bi-brightness-high-fill' : 'bi bi-moon-stars-fill'
        btnTheme.classList = classBtnTheme
    }

    function setColorPrefer(newColor=null) {
        const inputColor = document.getElementById('input-color')
        const myroot = document.querySelector(':root')
        const newColorSet = newColor || inputColor.value

        localStorage.setItem('colorPreferSLA', newColorSet)

        myroot.style.setProperty('--bg-color-prefer', newColorSet)
        setBgColorPrefer(newColorSet)
    }

    // Adicione isso antes do seu return no App()
    const filteredData = useMemo(() => {
        const applyFilter = (list) => {
            if (!list) return []

            const u = filterUser.trim().toLowerCase()
            const t = filterTeam.trim().toLowerCase()

            if (!u && !t) return list

            return list.filter(item => {
                const matchUser = u && item.owninguser?.fullname?.toLowerCase().includes(u)
                const matchTeam = t && item.owningteam?.name?.toLowerCase() === t

                return matchUser || matchTeam
            })
        }

        return {
            naoAtribuidos: applyFilter(naoAtribuidos),
            atribuidos: applyFilter(atribuidos),
            escalados: applyFilter(escalados),
            agendados: applyFilter(agendados)
        }
    }, [naoAtribuidos, atribuidos, escalados, agendados, filterUser, filterTeam])

    if (!naoAtribuidos || !atribuidos || !escalados || !agendados) {
        return <p className="text-center mt-5">Carregando dados...</p>
    }

    return (
        <>
            <nav className="navbar bg-body-tertiary">
                <div className="container-fluid">
                    <div className="row row-cols-3 align-items-center w-100">
                        <div className="col">
                            <img src="/Logo_add_it_white.png" alt="Logo" className="d-none d-md-inline-block logo-image me-4" />
                            <img src="/SLA-icon-x192.png" alt="Logo" className="d-inline-block d-md-none logo-image-icon me-3" />
                        </div>
                        <div className="col">
                            <h3 className="text-center">SLA MONITOR</h3>
                        </div>
                        <div className="col text-end">
                            <span className="border border-primary rounded p-2 me-3 bg-blur">{formatDate(now)}</span>
                            <button className="btn" onClick={toggleTheme}><i id="btn-theme" className="bi bi-brightness-high-fill"></i></button>
                        </div>
                    </div>
                </div>
            </nav>
            <div className="container-fluid text-center px-5">
                <div className="row">
                    <div className="col my-3 p-0">
                        <div className="float-start session-color">
                            <span className="me-3">Personalizar</span>
                            <input id="input-color" type="color" className="color-personate my-0 p-0" value={bgColorPrefer} onChange={(e) => setColorPrefer(e.target.value)} />
                        </div>
                        <div className="input-group float-end w-50">
                            <span className="input-group-text" id="filter-user">Consultor</span>
                            <input type="text" className="form-control" placeholder="Seu nome..." 
                                aria-label="Consultor" aria-describedby="filter-user" value={filterUser} onChange={(e) => {
                                    setFilterUser(e.target.value)
                                }} />
                            <span className="input-group-text" id="filter-team">Equipe</span>
                            <select className="form-select" aria-label="Default select example" defaultValue='' onChange={(e) => {
                                    setFilterTeam(e.target.value)
                                }}>
                                <option value='' selected>Todas</option>
                                <option value="Equipe - Backup/Restore">Equipe - Backup/Restore</option>
                                <option value="Equipe - BD">Equipe - BD</option>
                                <option value="Equipe - CRM">Equipe - CRM</option>
                                <option value="Equipe - CTX/MS">Equipe - CTX/MS</option>
                                <option value="Equipe - DC">Equipe - DC</option>
                                <option value="Equipe - DR">Equipe - DR</option>
                                <option value="Equipe - LNX">Equipe - LNX</option>
                                <option value="Equipe - NOC">Equipe - NOC</option>
                                <option value="Equipe - SGS">Equipe - SGS</option>
                                <option value="Equipe - SGS/DC">Equipe - SGS/DC</option>
                                <option value="Equipe - SOC">Equipe - SOC</option>
                            </select>
                        </div>
                    </div>
                </div>
                <Tabela_NaoAtribuidos titulo="Não Atribuídas" dados={filteredData.naoAtribuidos} extraClass={"bg-dark-subtle"} />
                <Tabela_Atribuidos titulo="Atribuídas" dados={filteredData.atribuidos} extraClass={"bg-dark-subtle"} />
                <Tabela_Escalados titulo="Escaladas" dados={filteredData.escalados} extraClass={"bg-dark-subtle"} />
                <Tabela_Agendados titulo="Agendadas" dados={filteredData.agendados} extraClass={"bg-dark-subtle"} />
            </div>
        </>
    )
}

export default App