# =================================================================
# Dockerfile cho QTKD Web API (.NET 10 Modular Monolith)
# =================================================================

# Stage 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Sao chép solution và các file project để tận dụng Docker layer cache khi restore
COPY ["QtkdSolution.sln", "./"]
COPY ["src/BuildingBlocks/Qtkd.BuildingBlocks.csproj", "src/BuildingBlocks/"]
COPY ["src/Modules/Identity/Qtkd.Modules.Identity.csproj", "src/Modules/Identity/"]
COPY ["src/Modules/Customers/Qtkd.Modules.Customers.csproj", "src/Modules/Customers/"]
COPY ["src/Modules/Contracts/Qtkd.Modules.Contracts.csproj", "src/Modules/Contracts/"]
COPY ["src/Modules/Pricing/Qtkd.Modules.Pricing.csproj", "src/Modules/Pricing/"]
COPY ["src/Modules/Production/Qtkd.Modules.Production.csproj", "src/Modules/Production/"]
COPY ["src/Modules/Payments/Qtkd.Modules.Payments.csproj", "src/Modules/Payments/"]
COPY ["src/Modules/Workflow/Qtkd.Modules.Workflow.csproj", "src/Modules/Workflow/"]
COPY ["src/Modules/Audit/Qtkd.Modules.Audit.csproj", "src/Modules/Audit/"]
COPY ["src/Modules/ESign/Qtkd.Modules.ESign.csproj", "src/Modules/ESign/"]
COPY ["src/Modules/Notification/Qtkd.Modules.Notification.csproj", "src/Modules/Notification/"]
COPY ["src/Api/Qtkd.Api.csproj", "src/Api/"]
COPY ["tests/UnitTests/Qtkd.UnitTests.csproj", "tests/UnitTests/"]
COPY ["tests/IntegrationTests/Qtkd.IntegrationTests.csproj", "tests/IntegrationTests/"]

RUN dotnet restore "QtkdSolution.sln"

# Sao chép toàn bộ mã nguồn và biên dịch Release
COPY . .
WORKDIR "/src/src/Api"
RUN dotnet publish "Qtkd.Api.csproj" -c Release -o /app/publish --no-restore

# Stage 2: Runtime Image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5210
ENV ASPNETCORE_ENVIRONMENT=Development

EXPOSE 5210
ENTRYPOINT ["dotnet", "Qtkd.Api.dll"]

