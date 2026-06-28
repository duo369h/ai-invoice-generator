# Corvioz Export Flow State Diagram v1.5

This diagram visualizes the multi-step export flow state logic implemented in v1.5.

```mermaid
graph TD
    Start([User Requests PDF Export]) --> GetCount[Check Local Storage export_count]
    GetCount --> CheckPlan{Is User Pro/Studio?}
    
    %% Paid Plan Path
    CheckPlan -- Yes --> ProExport[Bypass Restrictions & Export Clean PDF]
    ProExport --> End([Done])
    
    %% Free Plan Path
    CheckPlan -- No --> CheckCount{export_count Value}
    
    %% 1st Export
    CheckCount -- "0 (1st Export)" --> FirstExport[Trigger Watermarked PDF Download]
    FirstExport --> IncCount1[Increment export_count to 1]
    IncCount1 --> ToastToast[Show Toast: Upgrade to remove watermark]
    ToastToast --> End
    
    %% 2nd Export
    CheckCount -- "1 (2nd Export)" --> ShowReinforceModal[Render Value Reinforcement Modal]
    ShowReinforceModal --> ReinforceChoices{User Decision}
    ReinforceChoices -- "Upgrade to Pro" --> GoPricingPro[Redirect to Pro Checkout]
    ReinforceChoices -- "Download Watermarked PDF" --> SecondExport[Trigger Watermarked PDF Download]
    SecondExport --> IncCount2[Increment export_count to 2]
    IncCount2 --> OpenUpsell[Show Pricing Upsell Modal]
    OpenUpsell --> End
    
    %% 3rd+ Export
    CheckCount -- ">= 2 (3rd+ Export)" --> ShowLockModal[Render Plan Selection Hard Lock Modal]
    ShowLockModal --> LockChoices{User Decision}
    LockChoices -- "Select Pro ($9/mo)" --> GoPricingPro2[Redirect to Pro Checkout]
    LockChoices -- "Select Studio ($29/mo)" --> GoPricingStudio[Redirect to Studio Checkout]
    LockChoices -- "Cancel" --> ReturnDash[Close Modal & Return to Dashboard]
    ReturnDash --> End
```

### Flow Notes:
1. **Watermark Download**: Available on 1st and 2nd export only.
2. **Hard Wall**: The 3rd attempt blocks the download completely, forcing plan selection or modal dismissal.
3. **Persistency**: The export count is tracked using `window.localStorage` (key: `corvioz_export_count`).
