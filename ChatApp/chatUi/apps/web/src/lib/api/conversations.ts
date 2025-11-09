import { apiClient } from './client'

export interface CheckConversationExistsRequest {
    userOneId: string
    userTwoId: string
}

export interface ConversationResponse {
    conversationId: string
}

export interface ViewMyConversations {
    userId: string
    conversationId: string
    conversationType: 'DIRECT' | 'GROUP' | 'EXTERNAL_GROUP'
    titleByMember: string
    lastMessageId?: string
    lastMessageContent?: string
    lastMessageAt?: string
    lastMessageSenderDisplayName?: string
    unreadCount: number
}

export interface MessageResponse {
    id: string
    conversationId: string
    senderId: string
    content: string
    sentAt: string
    isRead: boolean
    isSystem: boolean
}

export interface PaginatedMessagesResponse {
    pageIndex: number
    pageSize: number
    totalPages: number
    data: MessageResponse[]
}

export interface CreateGroupRequest {
    groupName: string
    memberIds: string[]
}

export interface CreateConversationGroupResponse {
    conversationId: string
    groupName: string
    createdByUserId: string
    memberIds: string[]
    createdAt: string
}

export interface GroupMember {
    id: string
    displayName: string
    joinedAt: string
    addedByUserId?: string
    addByDisplayName?: string
    isOwner: boolean
}

/**
 * Conversations API
 */
export const conversationsApi = {
    /**
     * Check if a conversation exists between two users
     * If exists, returns the conversation ID
     */
    checkExists: async (userOneId: string, userTwoId: string): Promise<string> => {
        const conversationId = await apiClient.post<string>('/api/conversations/exists', {
            userOneId,
            userTwoId,
        })
        return conversationId
    },

    /**
     * Get all conversations for a user
     * @param userId - The user ID to fetch conversations for
     * @returns Promise with array of ViewMyConversations
     */
    getByUser: async (userId: string): Promise<ViewMyConversations[]> => {
        return apiClient.get<ViewMyConversations[]>(`/api/conversations/by-user/${userId}`)
    },

    /**
     * Get messages for a conversation with pagination
     * @param conversationId - The conversation ID
     * @param pageIndex - Page number (default: 1)
     * @param pageSize - Number of messages per page (default: 50)
     * @returns Promise with paginated messages response
     */
    getMessages: async (
        conversationId: string,
        pageIndex: number = 1,
        pageSize: number = 50,
    ): Promise<PaginatedMessagesResponse> => {
        return apiClient.get<PaginatedMessagesResponse>(`/api/conversations/${conversationId}/messages`, {
            params: { pageIndex, pageSize },
        })
    },

    /**
     * Delete a conversation
     * @param conversationId - The conversation ID to delete
     * @returns Promise<void>
     */
    delete: async (conversationId: string): Promise<void> => {
        return apiClient.delete(`/api/conversations/${conversationId}`)
    },

    /**
     * Create a new group conversation
     * @param request - Group name and member IDs
     * @returns Promise with created group details
     */
    createGroup: async (request: CreateGroupRequest): Promise<CreateConversationGroupResponse> => {
        return apiClient.post<CreateConversationGroupResponse>('/api/conversations/groups', request)
    },

    /**
     * Get members of a group conversation
     * @param conversationId - The conversation ID
     * @returns Promise with array of group members
     */
    getGroupMembers: async (conversationId: string): Promise<GroupMember[]> => {
        return apiClient.get<GroupMember[]>(`/api/conversations/${conversationId}/members`)
    },

    /**
     * Remove a member from a group conversation
     * @param conversationId - The conversation ID
     * @param memberId - The member ID to remove
     * @returns Promise<void>
     */
    removeMember: async (conversationId: string, memberId: string): Promise<void> => {
        return apiClient.delete(`/api/conversations/${conversationId}/members/${memberId}`)
    },

    /**
     * Leave a group conversation
     * @param conversationId - The conversation ID
     * @returns Promise<void>
     */
    leaveGroup: async (conversationId: string): Promise<void> => {
        return apiClient.post(`/api/conversations/${conversationId}/leave`)
    },

    /**
     * Kick a member from a group conversation
     * @param conversationId - The conversation ID
     * @param memberId - The member ID to kick
     * @param displayName - The display name of the member being kicked
     * @returns Promise<void>
     */
    kickMember: async (conversationId: string, memberId: string, displayName: string): Promise<void> => {
        return apiClient.post(`/api/conversations/${conversationId}/kick/${memberId}`, displayName)
    },

    /**
     * Add members to a group conversation
     * @param conversationId - The conversation ID
     * @param memberIds - Array of member IDs to add
     * @returns Promise<void>
     */
    addMembers: async (conversationId: string, memberIds: string[]): Promise<void> => {
        return apiClient.post(`/api/conversations/${conversationId}/members`, memberIds)
    },
}
