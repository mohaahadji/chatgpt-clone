import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    // Parse the JSON request body
    const { description } = await request.json();

    // Validate the description
    if (!description || typeof description !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid or missing 'description' in request body." }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate a response from OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful and friendly assistant.' },
        { role: 'user', content: description },
      ],
    });

    // Extract the generated content
    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      console.error("No content received from OpenAI API.");
      return new Response(
        JSON.stringify({ error: "No response content from OpenAI API." }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send the response back to the client
    return new Response(JSON.stringify({ response: responseText }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error fetching AI response:", error);

    // Send a clear error response
    return new Response(
      JSON.stringify({ error: "Failed to communicate with OpenAI API.", details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}