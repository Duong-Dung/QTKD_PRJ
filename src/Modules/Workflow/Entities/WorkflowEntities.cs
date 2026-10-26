using Qtkd.BuildingBlocks.Common;

namespace Qtkd.Modules.Workflow.Entities;

public enum WorkflowInstanceStatus
{
    Running = 1,
    Approved = 2,
    Rejected = 3,
    RevisionRequested = 4,
    Cancelled = 5
}

public class WorkflowDefinition : BaseEntity
{
    public string Code { get; set; } = string.Empty; // CONTRACT_APPROVAL, PRICING_APPROVAL, PAYMENT_APPROVAL
    public string Name { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
    public bool IsActive { get; set; } = true;

    public ICollection<StepDefinition> Steps { get; set; } = new List<StepDefinition>();
}

public class StepDefinition : BaseEntity
{
    public Guid WorkflowDefinitionId { get; set; }
    public WorkflowDefinition? WorkflowDefinition { get; set; }

    public int StepOrder { get; set; }
    public string StepName { get; set; } = string.Empty;
    public string RequiredRole { get; set; } = string.Empty;
    public string? RequiredDepartment { get; set; }
    public bool RequireCommentOnReject { get; set; } = true;
}

public class WorkflowInstance : BaseEntity
{
    public Guid WorkflowDefinitionId { get; set; }
    public WorkflowDefinition? WorkflowDefinition { get; set; }

    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public WorkflowInstanceStatus Status { get; set; } = WorkflowInstanceStatus.Running;
    public int CurrentStepOrder { get; set; } = 1;

    public ICollection<StepInstance> Steps { get; set; } = new List<StepInstance>();
    public ICollection<WorkflowHistory> Histories { get; set; } = new List<WorkflowHistory>();
}

public class StepInstance : BaseEntity
{
    public Guid WorkflowInstanceId { get; set; }
    public WorkflowInstance? WorkflowInstance { get; set; }

    public int StepOrder { get; set; }
    public string StepName { get; set; } = string.Empty;
    public Guid? AssignedUserId { get; set; }
    public string? AssignedUserName { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, InProgress, Approved, Rejected, Skipped
    public DateTimeOffset? CompletedAt { get; set; }
}

public class WorkflowHistory : BaseEntity
{
    public Guid WorkflowInstanceId { get; set; }
    public WorkflowInstance? WorkflowInstance { get; set; }

    public int StepOrder { get; set; }
    public string Action { get; set; } = string.Empty; // Submit, Approve, Reject, RequestRevision
    public Guid ActorId { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
}
