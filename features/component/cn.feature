Feature: className helper component

  Scenario: merges tailwind classes
    When I merge classes "p-2" and "p-4"
    Then the class string is "p-4"
