'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  createAgent,
  deleteAgentById,
  deleteChatsByAgentId,
  getAgentById,
  updateAgent,
} from '@/db/queries';

interface AgentFormData {
  name: string;
  description?: string;
  customInstructions?: string;
  aiModel: string;
}

export async function createAgentAction(userId: string, formData: FormData) {
  try {
    // Extract and validate form data
    const data: AgentFormData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      customInstructions: formData.get('customInstructions') as string,
      aiModel: formData.get('aiModel') as string,
    };

    const agent = await createAgent({
      ...data,
      userId,
    });

    console.log('Created agent:', agent);
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
    };

    await updateAgent({
      id: agentId,
      ...data,
    });

    redirect(`/agent/${agentId}`);
  } catch (error) {
    console.error('Failed to update agent:', error);
    throw error;
  }
}

export async function deleteAgentAction(userId: string, agentId: string) {
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

    await deleteChatsByAgentId({ id: agentId });
    await deleteAgentById({ id: agentId }); // cascade for now

    revalidatePath(`/agent/${agentId}`);
    revalidatePath(`/`);
    redirect(`/`);
  } catch (error) {
    console.error('Failed to delete agent:', error);
    throw error;
  }
}
