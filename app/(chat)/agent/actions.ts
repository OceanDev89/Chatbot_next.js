'use server';

import { createAgent, getAgentById, updateAgent } from '@/db/queries';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface AgentFormData {
  name: string;
  description?: string;
  customInstructions?: string;
  aiModel: string;
  activatedTools: Record<string, boolean>;
}

export async function createAgentAction(userId: string, formData: FormData) {
  try {
    // Extract and validate form data
    const data: AgentFormData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      customInstructions: formData.get('customInstructions') as string,
      aiModel: formData.get('aiModel') as string,
      activatedTools: Object.fromEntries(
        ['webSearch', 'dataAnalysis', 'codeInterpreter'].map((tool) => [
          tool,
          formData.get(`activatedTools.${tool}`) === 'on',
        ])
      ),
    };

    const agent = await createAgent({
      ...data,
      userId,
    });

    revalidatePath('/');
    redirect(`/agent/${agent.id}`);
  } catch (error) {
    console.error('Failed to create agent:', error);
    throw new Error('Failed to create agent');
  }
}

export async function updateAgentAction(
  userId: string,
  agentId: string,
  formData: FormData
) {
  try {
    // Get the agent to verify ownership
    const existingAgent = await getAgentById({ id: agentId });

    if (!existingAgent) {
      throw new Error('Agent not found');
    }

    // Verify ownership
    if (existingAgent.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const data: AgentFormData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      customInstructions: formData.get('customInstructions') as string,
      aiModel: formData.get('aiModel') as string,
      activatedTools: Object.fromEntries(
        ['webSearch', 'dataAnalysis', 'codeInterpreter'].map((tool) => [
          tool,
          formData.get(`activatedTools.${tool}`) === 'on',
        ])
      ),
    };

    await updateAgent({
      id: agentId,
      ...data,
    });

    revalidatePath(`/agent/${agentId}`);
    redirect(`/agent/${agentId}`);
  } catch (error) {
    console.error('Failed to update agent:', error);
    throw error;
  }
}
