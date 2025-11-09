namespace ChatApp.Application.Exceptions;

public class ExistException(string message) : Exception(message)
{
}