using System.Text.Json.Serialization;

namespace ChatApp.Domain.Enum;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ConversationType
{
    /// <summary>
    /// one-on-one conversation
    /// </summary>
    DIRECT,
    
    /// <summary>
    /// multi-user conversation
    /// </summary>
    GROUP,
    /// <summary>
    /// conversation involving external participants
    /// </summary>
    EXTERNAL_GROUP
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum Action
{
    /// <summary>
    /// user leave conversation
    /// </summary>
    LEAVE,
    
    /// <summary>
    /// user kicked out of chat
    /// </summary>
    KICK
}