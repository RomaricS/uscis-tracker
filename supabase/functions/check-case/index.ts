import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const USCIS_STATUS_URL = 'https://egov.uscis.gov/casestatus/mycasestatus.do'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth check — require valid Supabase JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const { receipt_no } = await req.json()
    if (!receipt_no || typeof receipt_no !== 'string') {
      return new Response(JSON.stringify({ error: 'receipt_no is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch from USCIS
    const uscisResponse = await fetchUSCISStatus(receipt_no.trim().toUpperCase())

    // Parse the HTML response to extract status text
    const statusText = parseStatusFromHTML(uscisResponse)

    // Map to CR1 stage
    const stage = parseStage(statusText)

    return new Response(
      JSON.stringify({
        receipt_no: receipt_no.trim().toUpperCase(),
        status_text: statusText,
        stage,
        checked_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('check-case error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function fetchUSCISStatus(receiptNo: string): Promise<string> {
  const params = new URLSearchParams({
    appReceiptNum: receiptNo,
    caseStatusSearchBtn: 'CHECK STATUS',
  })

  const response = await fetch(USCIS_STATUS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (compatible; USCIS-Tracker/1.0)',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    throw new Error(`USCIS returned ${response.status}`)
  }

  return response.text()
}

function parseStatusFromHTML(html: string): string {
  // USCIS wraps the status in <h1> inside a div.rows.text-center
  // Pattern: <h1>Case Status Title</h1>
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is)
  if (h1Match) {
    return h1Match[1].replace(/<[^>]+>/g, '').trim()
  }

  // Fallback: look for the status in a paragraph after "Current Status:"
  const statusMatch = html.match(/Current Status[:\s]*<\/?\w+[^>]*>\s*(.*?)(?:<\/p>|<br)/is)
  if (statusMatch) {
    return statusMatch[1].replace(/<[^>]+>/g, '').trim()
  }

  return ''
}

// Inline stage parsing (mirrors src/lib/parseStage.ts — kept in sync manually)
function parseStage(statusText: string): string | null {
  const text = statusText.toLowerCase().trim()

  if (
    text.includes('case was received') ||
    text.includes('case is being actively reviewed') ||
    text.includes('case was updated')
  ) return 'USCIS_RECEIVED'

  if (text.includes('biometric') || text.includes('fingerprint')) return 'BIOMETRICS'

  if (
    text.includes('case was approved') ||
    text.includes('case has been approved') ||
    text.includes('case was transferred') ||
    text.includes('approval notice was sent') ||
    text.includes('card was produced') ||
    text.includes('card was mailed')
  ) return 'I130_APPROVED'

  return null
}
