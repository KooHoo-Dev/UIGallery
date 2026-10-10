using UnityEngine;
using UnityEngine.InputSystem;

/// <summary>
/// 테스트용 입력 — 갤러리와 같은 단축키 (1: 피격, 2: 강한 피격, 3: 회복). 새 Input System 사용.
/// </summary>
public class HealthBarDemo : MonoBehaviour
{
    [SerializeField] HealthBarTrail bar;

    void Update()
    {
        var keyboard = Keyboard.current;
        if (keyboard == null) return;

        if (keyboard.digit1Key.wasPressedThisFrame) bar.TakeDamage(9f);
        if (keyboard.digit2Key.wasPressedThisFrame) bar.TakeDamage(28f);
        if (keyboard.digit3Key.wasPressedThisFrame) bar.Heal(35f);
    }
}
