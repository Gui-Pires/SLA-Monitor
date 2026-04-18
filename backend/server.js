// server.js
const express = require('express')
const axios = require('axios')
const cors = require('cors')
require('dotenv').config({ path: __dirname + '/.env' })

const app = express()
app.use(cors()) 
app.use(express.json())

// Configurações extraídas do process.env
const TENANT_ID = process.env.TENANT_ID
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const RESOURCE = process.env.RESOURCE

const DYNAMICS_URL = "https://addit.crm2.dynamics.com/api/data/v9.1"

async function getDynamicsToken() {
    const params = new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'client_credentials',
        resource: process.env.RESOURCE
    })
    const res = await axios.post(`https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/token`,
        params,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    return res.data.access_token
}

// Endpoint para buscar o Token
app.get('/api/token', async (req, res) => {
    // Verificação de segurança: garante que as variáveis foram carregadas
    if (!CLIENT_ID || !CLIENT_SECRET) {
        return res.status(500).json({ error: 'Configurações do servidor incompletas (.env)' })
    }

    const params = new URLSearchParams()
    params.append('client_id', CLIENT_ID)
    params.append('client_secret', CLIENT_SECRET)
    params.append('grant_type', 'client_credentials')
    params.append('resource', RESOURCE)

    try {
        const response = await axios.post(
            `https://login.microsoftonline.com/${TENANT_ID}/oauth2/token`,
            params,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )
        res.json({ access_token: response.data.access_token })
    } catch (error) {
        console.error("Erro na autenticação:", error.response?.data || error.message)
        res.status(500).json({ error: 'Falha ao obter token do Azure' })
    }
})

// Rota unificada para buscar todos os dados de uma vez
app.get('/api/sla-data', async (req, res) => {
    try {
        const token = await getDynamicsToken()
        const headers = { 
            Authorization: `Bearer ${token}`
            // 'Prefer': 'odata.include-annotations="*"'
        }

        // As mesmas consultas que estavam no front, agora protegidas aqui
        const [resNA_A, resAgen, resAllActives, slaKPI] = await Promise.all([
            axios.get(`${DYNAMICS_URL}/incidents?$expand=owningteam($select=name),owninguser($select=fullname,domainname),customerid_account($select=name),responsiblecontactid($select=fullname)&$filter=statecode eq 0 and statuscode ne 4 and statuscode ne 5 and firstresponsesent eq false and new_tipos ne 100000005 and new_preventiva eq false`, { headers }),
            axios.get(`${DYNAMICS_URL}/incidents?$expand=owningteam($select=name),owninguser($select=fullname,domainname),customerid_account($select=name),responsiblecontactid($select=fullname)&$filter=new_preventiva eq true and statecode eq 0 and add_datadoagendamento ne null and new_tipos ne 100000005&$orderby=add_datadoagendamento`, { headers }),
            axios.get(`${DYNAMICS_URL}/incidents?$expand=owningteam($select=name),owninguser($select=fullname,domainname),customerid_account($select=name),responsiblecontactid($select=fullname)&$filter=statecode eq 0&$orderby=createdon desc`, { headers }),
            axios.get(`${DYNAMICS_URL}/slakpiinstances?$select=failuretime&$expand=regarding_new_atribuicaoeescalacao($select=_new_ocorrencia_value,_new_atribuidoa_value,_new_equipe_value,new_prioritycodesla,createdon)&$filter=regarding_new_atribuicaoeescalacao/new_primeiraresposta eq false and status ne 4`, { headers })
        ])

        res.json({
            atendimentoGeral: resNA_A.data.value,
            agendados: resAgen.data.value,
            todosAtivos: resAllActives.data.value,
            slaKpis: slaKPI.data.value
        })
    } catch (error) {
        console.error("Erro ao buscar dados do Dynamics:", error.response?.data || error.message)
        res.status(500).json({ error: 'Erro interno ao processar dados' })
    }
})

// Usa a porta do .env ou a 3001 como padrão
const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Backend seguro rodando internamente na porta ${PORT}`))