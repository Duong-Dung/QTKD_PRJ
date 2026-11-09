using Qtkd.BuildingBlocks.Common;

namespace Qtkd.Modules.Workflow.Entities;

public enum WorkflowEntityType
{
    Contract,
    Addendum,
    PriceList,
    PaymentStatement
}

public enum AssigneeType
{
    User,
    RoleInDepartment
}

public enum OnRejectAction
{
    Rejected,
    RevisionRequested
}

public enum WorkflowInstanceStatus
{
    Running,
    Approved,
    Rejected,
    RevisionRequested,
    Cancelled
}

public enum WorkflowStepStatus
{
    Waiting,
    Pending,
    Approved,
    Rejected,
    RevisionRequested
}

public enum WorkflowAction
{
    Submit,
    Approve,
    Reject,
    RequestRevision,
    Cancel
}

public class WorkflowDefinition : AuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public WorkflowEntityType EntityType { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
    public bool IsActive { get; set; } = true;

    public ICollection<WorkflowStepDefinition> Steps { get; set; } = new List<WorkflowStepDefinition>();
    public ICollection<WorkflowInstance> Instances { get; set; } = new List<WorkflowInstance>();
}

public class WorkflowStepDefinition : AuditableEntity
{
    public Guid DefinitionId { get; set; }
    public int StepOrder { get; set; }
    public string Name { get; set; } = string.Empty;
    public AssigneeType AssigneeType { get; set; }
    public Guid? AssigneeUserId { get; set; }
    public Guid? AssigneeRoleId { get; set; }
    public Guid? AssigneeDepartmentId { get; set; }
    public OnRejectAction OnReject { get; set; } = OnRejectAction.RevisionRequested;

    public WorkflowDefinition? Definition { get; set; }
    public ICollection<WorkflowStepInstance> StepInstances { get; set; } = new List<WorkflowStepInstance>();
}

public class WorkflowInstance : AuditableEntity
{
    public Guid DefinitionId { get; set; }
    public WorkflowEntityType EntityType { get; set; }
    public Guid EntityId { get; set; }
    public WorkflowInstanceStatus Status { get; set; } = WorkflowInstanceStatus.Running;
    public int CurrentStepOrder { get; set; } = 1;
    public Guid StartedByUserId { get; set; }
    public DateTimeOffset StartedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAt { get; set; }

    public WorkflowDefinition? Definition { get; set; }
    public ICollection<WorkflowStepInstance> Steps { get; set; } = new List<WorkflowStepInstance>();
    public ICollection<WorkflowHistory> History { get; set; } = new List<WorkflowHistory>();
}

public class WorkflowStepInstance : AuditableEntity
{
    public Guid InstanceId { get; set; }
    public Guid StepDefinitionId { get; set; }
    public int StepOrder { get; set; }
    public Guid AssigneeUserId { get; set; }
    public WorkflowStepStatus Status { get; set; } = WorkflowStepStatus.Waiting;
    public Guid? ActedByUserId { get; set; }
    public DateTimeOffset? ActedAt { get; set; }
    public string? Comment { get; set; }

    public WorkflowInstance? Instance { get; set; }
    public WorkflowStepDefinition? StepDefinition { get; set; }
    public ICollection<WorkflowHistory> History { get; set; } = new List<WorkflowHistory>();
}

public class WorkflowHistory
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid InstanceId { get; set; }
    public Guid? StepInstanceId { get; set; }
    public WorkflowAction Action { get; set; }
    public Guid ActorUserId { get; set; }
    public string? FromStatus { get; set; }
    public string? ToStatus { get; set; }
    public string? Comment { get; set; }
    public DateTimeOffset OccurredAt { get; set; } = DateTimeOffset.UtcNow;

    public WorkflowInstance? Instance { get; set; }
    public WorkflowStepInstance? StepInstance { get; set; }
}

public class IdempotencyRecord
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid UserId { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
    public string RequestHash { get; set; } = string.Empty;
    public int ResponseStatus { get; set; }
    public string? ResponseBody { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
}
