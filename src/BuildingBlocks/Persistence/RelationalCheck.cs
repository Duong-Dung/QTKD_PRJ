using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Qtkd.BuildingBlocks.Persistence;

public static class RelationalCheck
{
    public static string InEnum<TEnum>(string column) where TEnum : struct, Enum
    {
        var values = string.Join(", ", Enum.GetNames<TEnum>().Select(name => $"'{name}'"));
        return $"{column} IN ({values})";
    }

    public static void HasStatusCheck<T, TEnum>(
        this TableBuilder<T> table,
        string constraintName,
        string column = "status")
        where T : class
        where TEnum : struct, Enum
    {
        table.HasCheckConstraint(constraintName, InEnum<TEnum>(column));
    }
}
