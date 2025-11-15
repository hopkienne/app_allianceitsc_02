namespace ChatApp.Contracts;

public static class Scopes
{
    public static class Users
    {
        public const string Read = MetaData.ProductName + "." + MetaData.Users + ".read";
        public const string Write = MetaData.ProductName + "." + MetaData.Users + ".create";
        public const string Delete = MetaData.ProductName + "." + MetaData.Users + ".delete";
        public const string Update = MetaData.ProductName + "." + MetaData.Users + ".update";
    }

    public static class ExternalConversation
    {
        public const string Read = MetaData.ProductName + "." + MetaData.ExternalConversation + ".read";
        public const string Write = MetaData.ProductName + "." + MetaData.ExternalConversation + ".create";
        public const string Delete = MetaData.ProductName + "." + MetaData.ExternalConversation + ".delete";
        public const string Update = MetaData.ProductName + "." + MetaData.ExternalConversation + ".update";
    }
}