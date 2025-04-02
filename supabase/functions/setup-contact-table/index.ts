PS C:\Users\g\friendlybattlegames wesbite> supabase link --project-ref gsctedyyn
sdzfzndsjpa
Enter your database Key1992$ (or leave blank to skip):import { serve } from "http/server"
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      // @ts-ignore: Deno env
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore: Deno env
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create contact_messages table if it doesn't exist
    const { error: createTableError } = await supabaseClient.rpc('create_contact_messages_table')

    if (createTableError) {
      console.error('Error creating table:', createTableError)
      throw createTableError
    }

    return new Response(
      JSON.stringify({ message: 'Contact messages table created successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
